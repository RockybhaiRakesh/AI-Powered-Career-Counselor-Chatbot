// pages/api/tool.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSubjectGroups } from '@/app/lib/tools/getSubjectGroups';
import { getSelectSubjects } from '@/app/lib/tools/getSelectsubject';
import { getInterestsByGroup } from '@/app/lib/tools/getInterestsByGroup';
import { getCoursesByInterest } from '@/app/lib/tools/getCoursesByInterest';
import { getCollegesByCourse } from '@/app/lib/tools/getCollegesByCourse';
import { getExamsByCollege } from '@/app/lib/tools/getExamsByCollege';
import { getCutoffForExam } from '@/app/lib/tools/getCutoffForExam';
import { getCareerPathSummary } from '@/app/lib/tools/getCareerPathSummary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Explicitly type req.body
  const { tool, input }: { tool: string; input?: any } = req.body;
  // You might still get 'any' here depending on the flexibility needed for 'input'.
  // A more robust solution would be to use a discriminated union type if possible.

  try {
    switch (tool) {
      case 'subject_group':
        return res.json(await getSubjectGroups());
      case 'subject':
        // Ensure getSelectSubjects expects string input
        return res.json(await getSelectSubjects(input as string));
      case 'interest':
        // Ensure getInterestsByGroup expects string input
        return res.json(await getInterestsByGroup(input as string));
      case 'course':
        // Ensure getCoursesByInterest expects specific object structure
        interface CourseInput { interest: string; group: string; }
        return res.json(await getCoursesByInterest((input as CourseInput).interest, (input as CourseInput).group));
      case 'college':
        return res.json(await getCollegesByCourse(input as string));
      case 'exam':
        interface ExamInput { college: string; course: string; }
        return res.json(await getExamsByCollege((input as ExamInput).college, (input as ExamInput).course));
      case 'cutoff':
        interface CutoffInput { exam: string; college: string; }
        return res.json(await getCutoffForExam((input as CutoffInput).exam, (input as CutoffInput).college));
      case 'summary':
        // Use the same interface as in getCareerPathSummary.ts
        interface SummaryInput { group: string; subjects: string; interest: string; course: string; college: string; }
        return res.json(await getCareerPathSummary(input as SummaryInput));
      default:
        return res.status(400).json({ error: 'Invalid tool name' });
    }
  } catch (error: any) { // This 'any' on the catch block is often fine in ESLint config
    console.error("API Tool Error:", error);
    return res.status(500).json({ error: error.message });
  }
}