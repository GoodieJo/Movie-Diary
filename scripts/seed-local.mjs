/**
 * seed-local.mjs — Seeds the local SQLite dev database with 10 demo entries.
 * Run: node scripts/seed-local.mjs
 */
import { createClient } from "@libsql/client";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root   = join(__dirname, "..");
const dbDir  = join(root, ".local-db");
const dbFile = join(dbDir, "movie-diary.db");

if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
const db = createClient({ url: `file:${dbFile}` });

await db.executeMultiple(`
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER,
  title TEXT NOT NULL, poster_url TEXT, genre TEXT, runtime INTEGER, overview TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  watched_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
  your_rating INTEGER, partner_rating INTEGER,
  favorite_scene TEXT, favorite_character TEXT, best_quote TEXT,
  laugh_memory TEXT, cry_memory TEXT, special_memory TEXT,
  mood_before TEXT, mood_after TEXT, location TEXT DEFAULT 'Home', snacks TEXT,
  added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const existing = await db.execute("SELECT COUNT(*) as cnt FROM movies");
if (Number(existing.rows[0].cnt) > 0) {
  console.log("Database already seeded. Delete .local-db/ to reset."); process.exit(0);
}

const movies = [
  [157336,"Interstellar","https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","Science Fiction",169,"A team of explorers travel through a wormhole in space."],
  [11216,"Cinema Paradiso","https://image.tmdb.org/t/p/w500/gCI2AeMV4IHSewhJkzsur2QWoFB.jpg","Drama",155,"A filmmaker recalls falling in love with movies as a child."],
  [597,"Titanic","https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","Romance",195,"A young aristocrat falls in love on the ill-fated R.M.S. Titanic."],
  [76341,"Mad Max: Fury Road","https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg","Action",120,"In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler."],
  [13,"Forrest Gump","https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg","Drama",142,"Historical events unfold through the eyes of a simple Alabama man."],
  [637,"Life is Beautiful","https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg","Drama",116,"A father uses humor to shield his son from the horrors of a death camp."],
  [105,"Back to the Future","https://image.tmdb.org/t/p/w500/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg","Science Fiction",116,"A teenager is sent thirty years into the past in a time-traveling DeLorean."],
  [140607,"The Force Awakens","https://image.tmdb.org/t/p/w500/wqnLdwVXoBjKibFRR5U3y0aDUhs.jpg","Action",138,"Three decades after the Empire defeat, a new threat arises."],
  [9806,"The Incredibles","https://image.tmdb.org/t/p/w500/2LqaLgk4Z226KkgPJuiOQ58ShKD.jpg","Animation",115,"A family of undercover superheroes are forced into action to save the world."],
  [872585,"Oppenheimer","https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg","Drama",180,"The story of J. Robert Oppenheimer and the development of the atomic bomb."],
];
for (const [a,b,c,d,e,f] of movies)
  await db.execute({ sql:"INSERT INTO movies (tmdb_id,title,poster_url,genre,runtime,overview) VALUES(?,?,?,?,?,?)", args:[a,b,c,d,e,f] });

const entries = [
  [1,"2024-02-14","20:00","22:49",5,5,"The docking scene","TARS","We used to look up at the sky","TARS honesty answers","The cornfield scene","You held my hand so tight during the wormhole scene. Best Valentine's Day ever.","Excited","Emotional","Home","Popcorn with truffle salt, red wine"],
  [2,"2024-03-08","19:30","22:05",5,4,"The final kissing montage","Alfredo","Whatever you end up doing, love it","Toto sneaking into the booth","The final scene, we were wrecked","We watched this on a rainy Sunday. By the end we were both crying.","Relaxed","Emotional","Home","Pasta, tiramisu"],
  [3,"2023-12-25","21:00","00:15",5,5,"The drawing scene","Jack","I'm the king of the world!","You yelling at Jack to get on the door","The ending. Every time.","Christmas night. You fell asleep in the first half and sobbed at the ending.","Happy","Emotional","Home","Hot chocolate, Christmas cookies"],
  [4,"2024-04-20","15:00","16:50",4,5,"Guitar riff on the war rig","Furiosa","Who killed the world?","The flamethrower guitarist",null,"You were convinced it would be terrible. You are now obsessed with Furiosa.","Tired","Inspired","Home","Nachos, craft beer"],
  [5,"2023-11-11","18:00","20:22",5,5,"Run Forrest Run!","Forrest Gump","Life is like a box of chocolates","Every oblivious Forrest moment","When Bubba dies. And when Jenny dies.","Our first movie together at your apartment. I spilled wine on the couch.","Happy","Loved It","Home","Homemade pasta, red wine"],
  [6,"2024-01-20","20:30","22:26",5,5,"Guido teaching Joshua the game","Guido","Buon giorno, Principessa!","Guido narrating everything as competition","The ending. The tank.","We could barely speak afterwards. Just held each other for a long time.","Relaxed","Emotional","Home","Italian wine, bruschetta"],
  [7,"2024-05-04","14:00","15:56",4,4,"The clock tower lightning scene","Doc Brown","Great Scott!","Marty playing guitar too hard",null,"May the Fourth! Perfect lazy Saturday.","Happy","Happy","Home","Pepsi, microwave popcorn"],
  [8,"2024-06-15","20:00","22:18",4,3,"Millennium Falcon escape from Jakku","Rey","Chewie, we're home","BB-8 giving a thumbs up",null,"I watched your face the whole time when Han Solo appeared. Worth it.","Excited","Loved It","Cinema","Cinema popcorn, Coke, Maltesers"],
  [9,"2024-07-28","11:00","12:55",5,5,"The superhero landing montage","Edna Mode","No capes!","Every single Edna scene","When Bob thinks his family is gone","Still in pajamas. Still one of the best animated films ever made.","Relaxed","Loved It","Home","Pancakes in bed, orange juice"],
  [10,"2024-08-10","20:30","23:30",4,4,"The Trinity test","Oppenheimer","Now I am become Death","Waiting for the blast wave","Final conversation with Einstein","We argued about it for two hours over dinner. Best date night in months.","Excited","Inspired","Cinema","Cinema popcorn, sparkling water"],
];
for (const [a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p] of entries)
  await db.execute({
    sql:`INSERT INTO diary_entries (movie_id,watched_date,start_time,end_time,your_rating,partner_rating,favorite_scene,favorite_character,best_quote,laugh_memory,cry_memory,special_memory,mood_before,mood_after,location,snacks) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args:[a,b,c,d,e,f,g,h,i,j??null,k??null,l,m,n,o,p]
  });

console.log("Seeded 10 movies + entries into", dbFile);
process.exit(0);
