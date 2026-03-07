import { db } from "./client";
import {
  users,
  vouches,
  posts,
  likes,
  comments,
  follows,
  stories,
} from "./schema";
import { computePalier } from "./palier";

async function seed() {
  console.log("🌱 Seeding Garona...");

  // Clean
  await db.delete(stories);
  await db.delete(comments);
  await db.delete(likes);
  await db.delete(follows);
  await db.delete(vouches);
  await db.delete(posts);
  // Don't delete users if BetterAuth accounts reference them
  // For clean seed, delete accounts/sessions first
  const { accounts, sessions, verifications } = await import("./schema");
  await db.delete(accounts);
  await db.delete(sessions);
  await db.delete(verifications);
  await db.delete(users);

  // ─── Users ───
  const seedUsers = [
    {
      name: "Nezz",
      username: "nezz",
      email: "nezz@garona.city",
      bio: "Dev toulousain 🧱",
      avatarUrl: "https://i.pravatar.cc/150?u=nezz",
    },
    {
      name: "Sarah Dupont",
      username: "sarah.capitole",
      email: "sarah@garona.city",
      bio: "Archi & patrimoine 🏛",
      avatarUrl: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Alex Martin",
      username: "alex.cuisine",
      email: "alex@garona.city",
      bio: "Chef au marché Victor Hugo 🍳",
      avatarUrl: "https://i.pravatar.cc/150?u=alex",
    },
    {
      name: "Marco Rossi",
      username: "marco.stade",
      email: "marco@garona.city",
      bio: "Rugby & bière artisanale 🏉",
      avatarUrl: "https://i.pravatar.cc/150?u=marco",
    },
    {
      name: "Luna Petit",
      username: "luna.minimes",
      email: "luna@garona.city",
      bio: "Illustratrice 🎨 St-Cyprien",
      avatarUrl: "https://i.pravatar.cc/150?u=luna",
    },
    {
      name: "Youssef Benali",
      username: "youssef.mirail",
      email: "youssef@garona.city",
      bio: "Photo de rue 📸",
      avatarUrl: "https://i.pravatar.cc/150?u=youssef",
    },
    {
      name: "Camille Roux",
      username: "camille.carmes",
      email: "camille@garona.city",
      bio: "Yoga & brunch lover 🧘",
      avatarUrl: "https://i.pravatar.cc/150?u=camille",
    },
    {
      name: "Thomas Blanc",
      username: "thomas.aerospace",
      email: "thomas@garona.city",
      bio: "Airbus by day, DJ by night 🎧",
      avatarUrl: "https://i.pravatar.cc/150?u=thomas",
    },
    {
      name: "Léa Fabre",
      username: "lea.jeanjaures",
      email: "lea@garona.city",
      bio: "Bouquiniste 📚 Jean Jaurès",
      avatarUrl: "https://i.pravatar.cc/150?u=lea",
    },
    {
      name: "Omar Diallo",
      username: "omar.arnaud",
      email: "omar@garona.city",
      bio: "Barbier & storyteller 💈",
      avatarUrl: "https://i.pravatar.cc/150?u=omar",
    },
    {
      name: "Julie Garnier",
      username: "julie.prairie",
      email: "julie@garona.city",
      bio: "Prairie des Filtres sunset collector 🌅",
      avatarUrl: "https://i.pravatar.cc/150?u=julie",
    },
    {
      name: "Rami Khoury",
      username: "rami.bayard",
      email: "rami@garona.city",
      bio: "Falafel king, place Bayard 🧆",
      avatarUrl: "https://i.pravatar.cc/150?u=rami",
    },
    {
      name: "Emma Leroux",
      username: "emma.botanique",
      email: "emma@garona.city",
      bio: "Jardin des Plantes regular 🌿",
      avatarUrl: "https://i.pravatar.cc/150?u=emma",
    },
    {
      name: "Lucas Morel",
      username: "lucas.ponts",
      email: "lucas@garona.city",
      bio: "Skateur, Pont St-Pierre ↔ Pont Neuf 🛹",
      avatarUrl: "https://i.pravatar.cc/150?u=lucas",
    },
    {
      name: "Inès Boucher",
      username: "ines.saintcyp",
      email: "ines@garona.city",
      bio: "Céramiste à St-Cyprien 🏺",
      avatarUrl: "https://i.pravatar.cc/150?u=ines",
    },
  ];

  const inserted = await db.insert(users).values(seedUsers).returning();
  console.log(`  ✅ ${inserted.length} users`);

  // ─── Vouches ───
  // Build a realistic trust graph:
  // nezz (0) is a Capitoul — everyone vouches for him
  // sarah (1), alex (2) are Ambassadeurs
  // marco (3), luna (4), youssef (5) are Toulousains
  // camille (6), thomas (7) are Habitants
  // léa (8), omar (9) are Voisins
  // julie (10), rami (11), emma (12) are Observateurs (new, few vouches)
  // lucas (13), inès (14) are brand new (0 vouches)

  const u = inserted;
  const vouchPairs: [number, number][] = [
    // Everyone vouches nezz (palier 5)
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [6, 0],
    [7, 0],
    [8, 0],
    [9, 0],
    [10, 0],
    [11, 0],
    // Many vouch sarah (palier 4)
    [0, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 1],
    [8, 1],
    [9, 1],
    [10, 1],
    // Many vouch alex (palier 4)
    [0, 2],
    [1, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [7, 2],
    [8, 2],
    [9, 2],
    [10, 2],
    // Some vouch marco (palier 3)
    [0, 3],
    [1, 3],
    [2, 3],
    [4, 3],
    [5, 3],
    // Some vouch luna (palier 3)
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [5, 4],
    // Some vouch youssef (palier 3)
    [0, 5],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    // A few vouch camille (palier 2)
    [0, 6],
    [1, 6],
    [2, 6],
    // A few vouch thomas (palier 2)
    [0, 7],
    [1, 7],
    [3, 7],
    // Couple vouch léa (palier 1)
    [0, 8],
    // Couple vouch omar (palier 1)
    [0, 9],
    // julie, rami, emma just joined — 0 vouches (palier 0)
    // lucas, inès — 0 vouches (palier 0)
  ];

  const vouchValues = vouchPairs.map(([voucher, vouchee]) => ({
    voucherId: u[voucher].id,
    voucheeId: u[vouchee].id,
    weight: 1, // simplified: weight 1 for seed, real system uses vouchWeight()
  }));

  if (vouchValues.length > 0) {
    await db.insert(vouches).values(vouchValues);
    console.log(`  ✅ ${vouchValues.length} vouches`);
  }

  // ─── Posts (only from users with palier >= 2) ───
  const postData = [
    {
      authorId: u[0].id,
      imageUrl: "https://picsum.photos/seed/capitole/600/600",
      caption: "Le Capitole ce soir 🌙",
    },
    {
      authorId: u[0].id,
      imageUrl: "https://picsum.photos/seed/canal/600/600",
      caption: "Canal du Midi, pause déjeuner 🚲",
    },
    {
      authorId: u[1].id,
      imageUrl: "https://picsum.photos/seed/saintse/600/600",
      caption: "Saint-Sernin au petit matin ✨",
    },
    {
      authorId: u[1].id,
      imageUrl: "https://picsum.photos/seed/garonne/600/600",
      caption: "La Garonne sous les nuages",
    },
    {
      authorId: u[2].id,
      imageUrl: "https://picsum.photos/seed/vh1/600/600",
      caption: "Samedi matin au marché Victor Hugo 🧀",
    },
    {
      authorId: u[2].id,
      imageUrl: "https://picsum.photos/seed/plat/600/600",
      caption: "Cassoulet maison, recette secrète 🤫",
    },
    {
      authorId: u[3].id,
      imageUrl: "https://picsum.photos/seed/rugby/600/600",
      caption: "Allez le Stade 🔴⚫",
    },
    {
      authorId: u[4].id,
      imageUrl: "https://picsum.photos/seed/art1/600/600",
      caption: "Nouvelle fresque rue Gramat 🎨",
    },
    {
      authorId: u[4].id,
      imageUrl: "https://picsum.photos/seed/art2/600/600",
      caption: "Sketch du Pont Neuf",
    },
    {
      authorId: u[5].id,
      imageUrl: "https://picsum.photos/seed/street/600/600",
      caption: "Rue de la Colombette, lumière parfaite 📸",
    },
    {
      authorId: u[5].id,
      imageUrl: "https://picsum.photos/seed/mirail/600/600",
      caption: "Le Mirail a ses beautés aussi",
    },
    {
      authorId: u[6].id,
      imageUrl: "https://picsum.photos/seed/yoga/600/600",
      caption: "Yoga aux Carmes ce matin 🧘",
    },
    {
      authorId: u[7].id,
      imageUrl: "https://picsum.photos/seed/dj/600/600",
      caption: "Set au Bikini hier soir 🎧",
    },
  ];
  const insertedPosts = await db.insert(posts).values(postData).returning();
  console.log(`  ✅ ${insertedPosts.length} posts`);

  // ─── Likes ───
  const likeValues: { postId: string; userId: string }[] = [];
  for (const post of insertedPosts) {
    // Random 3-8 likes per post from random users
    const numLikes = 3 + Math.floor(Math.random() * 6);
    const likers = new Set<number>();
    while (likers.size < numLikes) {
      const idx = Math.floor(Math.random() * 10); // only active users like
      if (u[idx].id !== post.authorId) likers.add(idx);
    }
    for (const idx of likers) {
      likeValues.push({ postId: post.id, userId: u[idx].id });
    }
  }
  await db.insert(likes).values(likeValues);
  console.log(`  ✅ ${likeValues.length} likes`);

  // ─── Comments ───
  const commentTexts = [
    "Magnifique ! 😍",
    "J'adore cet endroit",
    "Trop beau 🔥",
    "On se retrouve là ?",
    "Ça me manque Toulouse...",
    "Le meilleur quartier",
    "📸 superbe",
    "👏👏👏",
    "C'est où exactement ?",
    "Il faut que j'y aille",
    "Classique !",
    "La ville rose 🌸",
  ];
  const commentValues: { postId: string; authorId: string; text: string }[] =
    [];
  for (const post of insertedPosts) {
    const numComments = 1 + Math.floor(Math.random() * 4);
    const commenters = new Set<number>();
    while (commenters.size < numComments) {
      const idx = Math.floor(Math.random() * 10);
      if (u[idx].id !== post.authorId) commenters.add(idx);
    }
    for (const idx of commenters) {
      commentValues.push({
        postId: post.id,
        authorId: u[idx].id,
        text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
      });
    }
  }
  await db.insert(comments).values(commentValues);
  console.log(`  ✅ ${commentValues.length} comments`);

  // ─── Follows ───
  const followValues: { followerId: string; followingId: string }[] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (i !== j && Math.random() > 0.4) {
        followValues.push({ followerId: u[i].id, followingId: u[j].id });
      }
    }
  }
  await db.insert(follows).values(followValues);
  console.log(`  ✅ ${followValues.length} follows`);

  // ─── Stories (24h) ───
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const storyValues = [
    {
      authorId: u[0].id,
      imageUrl: "https://picsum.photos/seed/story1/400/700",
      expiresAt: tomorrow,
    },
    {
      authorId: u[1].id,
      imageUrl: "https://picsum.photos/seed/story2/400/700",
      expiresAt: tomorrow,
    },
    {
      authorId: u[4].id,
      imageUrl: "https://picsum.photos/seed/story3/400/700",
      expiresAt: tomorrow,
    },
    {
      authorId: u[5].id,
      imageUrl: "https://picsum.photos/seed/story4/400/700",
      expiresAt: tomorrow,
    },
  ];
  await db.insert(stories).values(storyValues);
  console.log(`  ✅ ${storyValues.length} stories`);

  console.log("\n🎉 Seed complete!");
  console.log("\nPalier summary:");
  // Count vouches per user
  for (let i = 0; i < inserted.length; i++) {
    const count = vouchPairs.filter(([_, vouchee]) => vouchee === i).length;
    const palier = computePalier(count);
    console.log(
      `  ${inserted[i].username.padEnd(20)} ${count} vouches → palier ${palier} (${["Observateur", "Voisin", "Habitant", "Toulousain", "Ambassadeur", "Capitoul"][palier]})`,
    );
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
