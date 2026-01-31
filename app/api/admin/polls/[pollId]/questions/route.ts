import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// POST /api/admin/polls/[pollId]/questions - Add question
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    // Get max sort order
    const lastQuestion = await prisma.question.findFirst({
      where: { pollId: params.pollId },
      orderBy: { sortOrder: "desc" },
    });

    const question = await prisma.question.create({
      data: {
        pollId: params.pollId,
        text,
        sortOrder: (lastQuestion?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/polls/[pollId]/questions - Delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
