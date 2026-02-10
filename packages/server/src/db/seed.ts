import { randomUUID } from "node:crypto";
import { db, teams } from "./index.js";

const seedTeams = [
  { id: randomUUID(), name: "Frontend", description: "Frontend development team", color: "#3b82f6" },
  { id: randomUUID(), name: "Backend", description: "Backend development team", color: "#10b981" },
  { id: randomUUID(), name: "QA", description: "Quality assurance team", color: "#f59e0b" },
  { id: randomUUID(), name: "DevOps", description: "DevOps and infrastructure team", color: "#8b5cf6" },
] as const;

for (const team of seedTeams) {
  db.insert(teams)
    .values(team)
    .onConflictDoNothing()
    .run();
}

console.log(`Seeded ${seedTeams.length} teams`);
