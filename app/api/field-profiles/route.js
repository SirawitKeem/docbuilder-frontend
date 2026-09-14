import { fieldProfilesRepo } from "@/lib/db/repositories";

export async function GET() {
  const profiles = await fieldProfilesRepo.getAll();
  return Response.json(profiles);
}

export async function POST(request) {
  const body = await request.json();
  const profile = await fieldProfilesRepo.create(body);
  return Response.json(profile);
}
