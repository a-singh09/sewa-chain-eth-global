import { NextResponse } from "next/server";

export async function POST() {
  const uuid =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // TODO: Store the ID field in your database so you can verify the payment later

  return NextResponse.json({ id: uuid });
}
