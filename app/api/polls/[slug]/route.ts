import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/polls/[slug]
// Returns poll info, questions, and candidates (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const poll = await prisma.poll.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
        candidates: {
          orderBy: { displayName: "asc" },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json({
      poll: {
        id: poll.id,
        title: poll.title,
        slug: poll.slug,
        status: poll.status,
      },
      questions: poll.questions,
      candidates: poll.candidates,
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}
