// pages/api/tool.ts (or app/api/tool/route.ts for App Router)
import { NextApiRequest, NextApiResponse } from 'next';
import { getSubjectGroups } from '@/app/lib/tools/getSubjectGroups';
import { getSelectSubjects } from '@/app/lib/tools/getSelectsubject';
import { getInterestsFromSelectedSubjects } from '@/app/lib/tools/getInterestsFromSelectedSubjects';
import { getCoursesByInterest } from '@/app/lib/tools/getCoursesByInterest';
import { getCollegesByCourse } from '@/app/lib/tools/getCollegesByCourse';
import { getExamsByCollege } from '@/app/lib/tools/getExamsByCollege';
import { getCutoffForExam } from '@/app/lib/tools/getCutoffForExam';
import { getCareerPathSummary } from '@/app/lib/tools/getCareerPathSummary';
import { getChatResponse } from '@/app/lib/tools/chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is POST, as this API is designed to receive data.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. This endpoint only supports POST requests.' });
  }

  const { tool, input }: { tool: string; input?: any } = req.body;

  // Basic validation for the 'tool' parameter
  if (!tool) {
    return res.status(400).json({ error: 'Missing "tool" parameter in request body.' });
  }

  try {
    switch (tool) {
      case 'subject_group':
        return res.json(await getSubjectGroups());

      case 'subject':
        return res.json(await getSelectSubjects(input as string));

      case 'interest':
        return res.json(await getInterestsFromSelectedSubjects(input as string[]));

      case 'course':
        interface CourseInput { interest: string[]; group: string; }
        const courseInput = input as CourseInput;
        return res.json(await getCoursesByInterest(courseInput.interest, courseInput.group));

      case 'college':
        return res.json(await getCollegesByCourse(input as string));

      case 'exam':
        interface ExamInput { college: string; course: string; }
        const examInput = input as ExamInput;
        return res.json(await getExamsByCollege(examInput.college, examInput.course));

      case 'cutoff':
        interface CutoffInput { exam: string; college: string; }
        const cutoffInput = input as CutoffInput;
        return res.json(await getCutoffForExam(cutoffInput.exam, cutoffInput.college));

      case 'summary':
        interface SummaryInput {
          group: string;
          subjects: string;
          interest: string;
          course: string;
          college: string;
          exam: string;
          cutoff: string;
        }
        const summaryInput = input as SummaryInput;
        return res.json(await getCareerPathSummary(summaryInput));

      case 'chat':
        // This line is correct as getChatResponse returns { content: "text" }
        return res.json(await getChatResponse(input as { role: string, content: string }[]));

      default:
        return res.status(400).json({ error: 'Invalid tool name provided.' });
    }
  } catch (error: any) {
    // Log the detailed error on the server side
    console.error(`API Tool Error processing '${tool}':`, error);
    // Ensure a valid JSON error response is always sent,
    // which helps the client-side response.json() avoid "Unexpected end of JSON input".
    return res.status(500).json({ error: `Server error while processing tool '${tool}': ${error.message || 'An unknown error occurred.'}` });
  }
}