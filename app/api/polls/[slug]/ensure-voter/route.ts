import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/polls/[slug]/ensure-voter
// Creates a new voter for the poll if needed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const poll = await prisma.poll.findUnique({
      where: { slug },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Create a new voter
    const voter = await prisma.voter.create({
      data: {
        pollId: poll.id,
      },
    });

    return NextResponse.json({
      pollId: poll.id,
      voterId: voter.id,
    });
  } catch (error) {
    console.error("Error creating voter:", error);
    return NextResponse.json(
      { error: "Failed to create voter" },
      { status: 500 }
    );
  }
}
