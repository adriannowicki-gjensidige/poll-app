"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
}

interface Candidate {
  id: string;
  displayName: string;
}

interface Poll {
  id: string;
  title: string;
  status: string;
}

interface ResultsData {
  poll: Poll;
  questions: Question[];
  candidates: Candidate[];
  results: Record<string, Record<string, number>>;
  totalVoters: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.pollId as string;

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/admin/polls/${pollId}/results`);
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [pollId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Failed to load results</p>
      </div>
    );
  }

  // Helper to get sorted results for a question
  const getSortedResults = (questionId: string) => {
    const questionResults = data.results[questionId] || {};
    return data.candidates
      .map((c) => ({
        candidate: c,
        votes: questionResults[c.id] || 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  };

  // Get total votes for a question
  const getTotalVotes = (questionId: string) => {
    const questionResults = data.results[questionId] || {};
    return Object.values(questionResults).reduce((sum, v) => sum + v, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href={`/admin/polls/${pollId}`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to poll
          </Link>
        </div>

        {/* Poll Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {data.poll.title} - Results
          </h1>
          <div className="flex gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.poll.status === "open"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {data.poll.status}
            </span>
            <span className="text-gray-600">
              {data.totalVoters} total voter(s)
            </span>
          </div>
        </div>

        {/* Results by Question */}
        {data.questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No questions in this poll</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.questions.map((question, index) => {
              const sortedResults = getSortedResults(question.id);
              const totalVotes = getTotalVotes(question.id);
              const maxVotes =
                sortedResults.length > 0 ? sortedResults[0].votes : 0;

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {index + 1}. {question.text}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {totalVotes} response(s)
                  </p>

                  {sortedResults.length === 0 ? (
                    <p className="text-gray-500">No candidates</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedResults.map((r) => {
                        const percentage =
                          totalVotes > 0
                            ? Math.round((r.votes / totalVotes) * 100)
                            : 0;
                        const isWinner = r.votes === maxVotes && maxVotes > 0;

                        return (
                          <div key={r.candidate.id}>
                            <div className="flex justify-between items-center mb-1">
                              <span
                                className={`font-medium ${
                                  isWinner ? "text-blue-600" : "text-gray-700"
                                }`}
                              >
                                {r.candidate.displayName}
                                {isWinner && maxVotes > 0 && " 👑"}
                              </span>
                              <span className="text-sm text-gray-600">
                                {r.votes} vote{r.votes !== 1 ? "s" : ""} (
                                {percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  isWinner ? "bg-blue-600" : "bg-gray-400"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
