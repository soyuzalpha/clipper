import bcrypt from "bcryptjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./data/content.db";
if (dbUrl.startsWith("file:")) {
  mkdirSync(dirname(dbUrl.slice("file:".length)), { recursive: true });
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: dbUrl }),
});

async function main() {
  console.log("Seeding…");

  // Wipe in FK-safe order (children first).
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.content.deleteMany();
  await prisma.clip.deleteMany();
  await prisma.video.deleteMany();
  await prisma.contentPlan.deleteMany();
  await prisma.script.deleteMany();
  await prisma.contentIdea.deleteMany();
  await prisma.campaignRequirement.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@clipper.os";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "clipper";
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  const ws = await prisma.workspace.create({ data: { name: "Default Workspace" } });
  await prisma.user.create({
    data: {
      workspaceId: ws.id,
      name: "Admin",
      email: adminEmail,
      passwordHash,
    },
  });
  console.log(`Created admin user: ${adminEmail}`);

  // Tags
  const tagNames = [
    ["unboxing", "#10b981"],
    ["gaming", "#a855f7"],
    ["podcast", "#3b82f6"],
    ["b-roll", "#f59e0b"],
    ["review", "#ef4444"],
  ];
  const tags = await Promise.all(
    tagNames.map(([name, color]) =>
      prisma.tag.create({ data: { workspaceId: ws.id, name, color } })
    )
  );

  // Campaigns
  const c1 = await prisma.campaign.create({
    data: {
      workspaceId: ws.id,
      name: "NovaPhone 7 Launch",
      brand: "NovaTech",
      creator: "Marcus Chen",
      description: "Launch campaign for the new NovaPhone 7 — unboxings, reviews, and head-to-head comparisons.",
      objective: "awareness",
      reward: "$500 flat + $2 per 1k views",
      rewardCents: 50000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "open",
      platforms: JSON.stringify(["tiktok", "youtube_shorts"]),
      format: "talking-head + unboxing",
      audience: "tech enthusiasts, age 18-35",
      minDurationSec: 30,
      maxDurationSec: 90,
      hashtags: JSON.stringify(["#NovaPhone7", "#TechReview", "#unboxing"]),
      mentions: JSON.stringify(["@novatech"]),
      requiredCta: "Link in bio",
      prohibitedTopics: "no competitor mentions",
      guidelines: "Show the device clearly in the first 3 seconds. Use trending audio where possible.",
      submissionProcedure: "Upload to TikTok and YouTube Shorts, then submit URLs via the dashboard.",
      rewardConditions: "Minimum 50k views required for payout.",
      sourceMaterial: "Press kit (logos, photos) + sample device",
      campaignUrl: "https://novatech.example.com/partners/novaphone7",
      opportunityScore: 87,
    },
  });

  const c2 = await prisma.campaign.create({
    data: {
      workspaceId: ws.id,
      name: "Strike Legends Season 4",
      brand: "PixelForge Games",
      creator: "Pro Strike League",
      description: "Promote Season 4 of Strike Legends with gameplay highlights and meta breakdowns.",
      objective: "engagement",
      reward: "$300 + bonus pool up to $1k",
      rewardCents: 30000,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "in_progress",
      platforms: JSON.stringify(["tiktok", "instagram_reels", "youtube_shorts"]),
      format: "gameplay capture + commentary",
      audience: "gamers 16-28, mobile + console",
      minDurationSec: 15,
      maxDurationSec: 60,
      hashtags: JSON.stringify(["#StrikeLegends", "#gaming", "#clips"]),
      mentions: JSON.stringify(["@strikelegends", "@pixelforge"]),
      prohibitedTopics: "no leaks, no datamined content",
      guidelines: "Record at 60fps minimum. Use original commentary or approved voiceover.",
      rewardConditions: "Top 10 clips win bonus share of pool.",
      opportunityScore: 72,
    },
  });

  const c3 = await prisma.campaign.create({
    data: {
      workspaceId: ws.id,
      name: "FitFuel Protein Winter Push",
      brand: "FitFuel",
      creator: "Coach Riley",
      description: "Authentic 30-day transformation stories featuring FitFuel protein.",
      objective: "conversions",
      reward: "Free product + 10% affiliate commission",
      rewardCents: null,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "open",
      platforms: JSON.stringify(["tiktok", "instagram_reels"]),
      format: "transformation vlog",
      audience: "fitness enthusiasts 18-30",
      minDurationSec: 20,
      maxDurationSec: 120,
      hashtags: JSON.stringify(["#FitFuel", "#transformation", "#fitness"]),
      mentions: JSON.stringify(["@fitfuel"]),
      opportunityScore: 58,
    },
  });

  // Campaign requirements
  await prisma.campaignRequirement.createMany({
    data: [
      { campaignId: c1.id, kind: "must_include", text: "Show the NovaPhone 7 screen clearly within first 3 seconds" },
      { campaignId: c1.id, kind: "must_mention", text: "Mention @novatech at least once" },
      { campaignId: c1.id, kind: "must_avoid", text: "No competitor comparisons in the hook" },
      { campaignId: c1.id, kind: "reward_condition", text: "Minimum 50k views required for payout" },
      { campaignId: c2.id, kind: "must_do", text: "Record at 60fps minimum" },
      { campaignId: c2.id, kind: "must_avoid", text: "No leaks, no datamined content" },
      { campaignId: c3.id, kind: "must_include", text: "Show real progress photos (before/after)" },
    ],
  });

  // Ideas
  const i1 = await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      campaignId: c1.id,
      title: "I Tested the NovaPhone 7 for 24 Hours",
      hook: "They said this phone can't be killed. I tried.",
      angle: "durability + daily-driver review",
      audience: "tech enthusiasts",
      format: "talking-head + screen recording",
      durationSec: 65,
      outline: "0:00 hook • 0:05 morning routine • 0:30 stress test • 1:00 verdict",
      cta: "Link in bio for pre-order",
      platform: "tiktok",
      viralScore: 84,
      difficulty: "medium",
      status: "selected",
    },
  });

  await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      campaignId: c1.id,
      title: "5 NovaPhone 7 Features Nobody Talks About",
      hook: "Feature #3 saved me $200.",
      angle: "hidden-gems listicle",
      format: "rapid-fire list",
      durationSec: 45,
      cta: "Comment which one surprised you",
      platform: "youtube_shorts",
      viralScore: 76,
      difficulty: "easy",
      status: "scripted",
    },
  });

  await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      campaignId: c1.id,
      title: "NovaPhone 7 vs My Old Phone — Night and Day",
      hook: "Side by side, the difference is embarrassing.",
      angle: "comparison",
      durationSec: 60,
      cta: "Drop your phone in the comments",
      viralScore: 68,
      difficulty: "medium",
      status: "idea",
    },
  });

  const i4 = await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      campaignId: c2.id,
      title: "This Strike Legends Trick Broke the Leaderboard",
      hook: "Nobody is going to believe this.",
      angle: "gameplay highlight + meta break",
      durationSec: 50,
      cta: "Try it before it gets patched",
      platform: "tiktok",
      viralScore: 91,
      difficulty: "hard",
      status: "ready",
    },
  });

  const i5 = await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      campaignId: c3.id,
      title: "I Drank FitFuel for 30 Days — Honest Results",
      hook: "30 days, two scoops a day, no filter.",
      angle: "transformation vlog",
      durationSec: 90,
      cta: "Link in bio for 10% off",
      platform: "tiktok",
      viralScore: 81,
      difficulty: "medium",
      status: "idea",
    },
  });

  await prisma.contentIdea.create({
    data: {
      workspaceId: ws.id,
      title: "5 Hooks That Stopped My Scroll This Week",
      hook: "Steal these.",
      angle: "meta / meta-education",
      durationSec: 25,
      cta: "Follow for more",
      viralScore: 73,
      difficulty: "easy",
      status: "idea",
    },
  });

  // Script for the selected idea
  await prisma.script.create({
    data: {
      ideaId: i1.id,
      hook: "They said this phone can't be killed. I tried.",
      intro: "Nova sent me the NovaPhone 7 to review — and to break.",
      body: "Day one: morning commute drop test. Day two: pool dunk. Day three: my toddler nephew. The result? Barely a scratch.",
      payoff: "Here's the part nobody talks about — the battery outlasted my last two phones combined.",
      cta: "Pre-order link in bio before it sells out Friday.",
      version: 2,
    },
  });

  // Plans (calendar)
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.contentPlan.createMany({
    data: [
      {
        workspaceId: ws.id,
        ideaId: i4.id,
        platform: "tiktok",
        publishAt: tomorrow,
        productionDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        editingDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000),
        status: "in_production",
      },
      {
        workspaceId: ws.id,
        ideaId: i1.id,
        platform: "tiktok",
        publishAt: inThreeDays,
        productionDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        editingDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: "ready",
      },
      {
        workspaceId: ws.id,
        ideaId: i5.id,
        platform: "tiktok",
        publishAt: nextWeek,
        productionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        editingDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: "planned",
      },
    ],
  });

  // Source video + clips
  const v = await prisma.video.create({
    data: {
      workspaceId: ws.id,
      title: "Marcus Chen Podcast — Ep. 42 (Full Interview)",
      sourceUrl: "https://example.com/podcast-ep42",
      durationSec: 3120,
      status: "ready",
    },
  });

  const clipData = [
    { title: "Tech industry takes", startSec: 120, endSec: 165, hook: "He just said the quiet part out loud", reason: "strong opinion + controversy", viralScore: 88 },
    { title: "The NovaPhone 7 reveal moment", startSec: 870, endSec: 925, hook: "Wait — they actually did THAT?", reason: "surprise + reveal", viralScore: 92 },
    { title: "Career advice for creators", startSec: 1450, endSec: 1500, hook: "Best 50 seconds of advice you'll hear today", reason: "universal wisdom", viralScore: 74 },
    { title: "The pricing rant", startSec: 2200, endSec: 2255, hook: "He's not wrong though", reason: "emotional + shareable", viralScore: 81 },
  ];
  const clips = [];
  for (const c of clipData) {
    clips.push(
      await prisma.clip.create({
        data: {
          videoId: v.id,
          title: c.title,
          startSec: c.startSec,
          endSec: c.endSec,
          hook: c.hook,
          reason: c.reason,
          viralScore: c.viralScore,
          status: "detected",
        },
      })
    );
  }

  // Two published contents + publications + analytics snapshots
  const c1Content = await prisma.content.create({
    data: {
      workspaceId: ws.id,
      ideaId: i4.id,
      title: "This Strike Legends Trick Broke the Leaderboard",
      caption: "Try it before it gets patched 😂 #StrikeLegends #gaming #clips",
      hashtags: JSON.stringify(["#StrikeLegends", "#gaming", "#clips"]),
      status: "published",
    },
  });
  const c1Pub = await prisma.publication.create({
    data: {
      contentId: c1Content.id,
      platform: "tiktok",
      url: "https://tiktok.com/@example/video/123",
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: "published",
    },
  });

  const c2Content = await prisma.content.create({
    data: {
      workspaceId: ws.id,
      title: "Best career advice for content creators",
      caption: "Save this — you'll need it.",
      hashtags: JSON.stringify(["#creator", "#advice"]),
      status: "published",
    },
  });
  const c2Pub = await prisma.publication.create({
    data: {
      contentId: c2Content.id,
      platform: "youtube_shorts",
      url: "https://youtube.com/shorts/abc",
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "published",
    },
  });

  // Analytics: 4 snapshots each showing growth
  async function snapshot(pubId: string, daysAgo: number, v: number, likes: number, comments: number, shares: number, saves: number, retention: number, eng: number) {
    return prisma.analyticsSnapshot.create({
      data: {
        publicationId: pubId,
        capturedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        views: v,
        likes,
        comments,
        shares,
        saves,
        watchTimeSec: Math.round(v * retention * 35),
        avgWatchSec: retention * 35,
        retention,
        engagementRate: eng,
        completionRate: retention + 0.05,
        followersGained: Math.round(v / 1000),
      },
    });
  }
  await snapshot(c1Pub.id, 6, 14_200, 980, 73, 142, 88, 0.52, 0.089);
  await snapshot(c1Pub.id, 4, 48_500, 3_300, 220, 410, 240, 0.58, 0.086);
  await snapshot(c1Pub.id, 2, 126_000, 9_100, 510, 1_180, 720, 0.61, 0.092);
  await snapshot(c1Pub.id, 0, 218_000, 15_400, 780, 2_010, 1_290, 0.63, 0.089);
  await snapshot(c2Pub.id, 10, 5_800, 410, 28, 64, 51, 0.49, 0.095);
  await snapshot(c2Pub.id, 7, 18_900, 1_410, 95, 210, 178, 0.55, 0.099);
  await snapshot(c2Pub.id, 3, 52_100, 3_780, 280, 612, 488, 0.59, 0.101);
  await snapshot(c2Pub.id, 0, 74_000, 5_290, 410, 870, 705, 0.6, 0.101);

  // Assets (individual creates — createMany doesn't support nested tag connects)
  const unboxingTag = tags.find((t) => t.name === "unboxing")!;
  const gamingTag = tags.find((t) => t.name === "gaming")!;
  const podcastTag = tags.find((t) => t.name === "podcast")!;
  const brollTag = tags.find((t) => t.name === "b-roll")!;
  const reviewTag = tags.find((t) => t.name === "review")!;

  await prisma.asset.create({ data: { workspaceId: ws.id, name: "NovaPhone 7 — Press Kit.zip", kind: "document", sizeBytes: 18_400_000, folder: "Campaigns/NovaPhone 7", tags: { connect: [{ id: reviewTag.id }] } } });
  await prisma.asset.create({ data: { workspaceId: ws.id, name: "Unboxing B-roll.mp4", kind: "video", sizeBytes: 142_000_000, folder: "Campaigns/NovaPhone 7", favorite: true, tags: { connect: [{ id: unboxingTag.id }, { id: brollTag.id }] } } });
  await prisma.asset.create({ data: { workspaceId: ws.id, name: "Strike Legends — Trick highlight.mp4", kind: "clip", sizeBytes: 28_000_000, folder: "Campaigns/Strike Legends", tags: { connect: [{ id: gamingTag.id }] } } });
  await prisma.asset.create({ data: { workspaceId: ws.id, name: "Episode 42 — Full recording.mp4", kind: "video", sizeBytes: 1_240_000_000, folder: "Source Videos", tags: { connect: [{ id: podcastTag.id }] } } });
  await prisma.asset.create({ data: { workspaceId: ws.id, name: "Career advice caption.txt", kind: "caption", sizeBytes: 1_200, folder: "Drafts", tags: { connect: [{ id: podcastTag.id }] } } });
  await prisma.asset.create({ data: { workspaceId: ws.id, name: "Strike Legends thumbnail.png", kind: "thumbnail", sizeBytes: 480_000, folder: "Campaigns/Strike Legends", tags: { connect: [{ id: gamingTag.id }] } } });

  // AI Analysis on campaign 1
  await prisma.aIAnalysis.create({
    data: {
      campaignId: c1.id,
      subjectType: "campaign",
      subjectId: c1.id,
      kind: "campaign_analysis",
      output: JSON.stringify({
        summary: "High-value tech launch campaign with strong reward ceiling. Audience overlap with creator's existing channel is strong.",
        requirements: [
          "Show the device within the first 3 seconds",
          "Mention @novatech in the video",
        ],
        restrictions: [
          "No unboxing-before-reveal of unreleased accessories",
          "No competitor comparisons on camera",
        ],
        risks: [
          "Tight 14-day deadline leaves little room for re-edits",
          "Trademark on 'NovaPhone' — avoid phonetic similarity in hook",
        ],
        targetAudience: [
          "tech enthusiasts, 18-35, daily-driver upgraders",
          "creator's existing audience of phone-comparison fans",
        ],
        contentAngles: [
          "durability + daily-driver stress test",
          "night-camera vs old phone side-by-side",
        ],
        strategy: [
          "Open on the stress test, not the spec sheet",
          "Curious, slightly skeptical tone — prove it on camera",
          "60-second runtime; verdict + pre-order CTA at the end",
        ],
        opportunityScore: 87,
      }),
      provider: "mock",
    },
  });

  // AI Recommendations
  await prisma.aIRecommendation.createMany({
    data: [
      {
        workspaceId: ws.id,
        kind: "publishing",
        title: "Publish Strike Legends clip tomorrow at 7pm",
        body: "Your gaming clips reach 32% more viewers when posted between 7-9pm on weekdays.",
        status: "new",
      },
      {
        workspaceId: ws.id,
        kind: "hook",
        title: "Try a stronger contradiction hook on NovaPhone idea",
        body: "Hooks framed as 'They said X — but I tested it' outperform listicle hooks by ~22% on this channel.",
        status: "new",
      },
      {
        workspaceId: ws.id,
        kind: "campaign",
        title: "New campaign matches your style: Solo Creator Challenge",
        body: "Detected 3 new campaigns in the last 24h with audience overlap > 80%.",
        status: "new",
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
