import { quotationsRepo } from "@/lib/db/repositories";

export async function GET() {
  const items = await quotationsRepo.getAll();
  return Response.json(items);
}

export async function POST(request) {
  const body = await request.json();
  const item = await quotationsRepo.create(body);
  return Response.json(item);
}
