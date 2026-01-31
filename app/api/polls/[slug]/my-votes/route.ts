import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/polls/[slug]/my-votes?voterId=...
// Returns votes for the given voter
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get("voterId");

    if (!voterId) {
      return NextResponse.json(
        { error: "voterId is required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.findUnique({
      where: { slug: params.slug },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const votes = await prisma.vote.findMany({
      where: {
        pollId: poll.id,
        voterId: voterId,
      },
      select: {
        questionId: true,
        candidateId: true,
      },
    });

    // Convert to a map for easy lookup: { questionId: candidateId }
    const voteMap: Record<string, string> = {};
    for (const vote of votes) {
      voteMap[vote.questionId] = vote.candidateId;
    }

    return NextResponse.json({ votes: voteMap });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
