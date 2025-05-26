// pages/api/tool.ts (Confirm this is exactly what you have)
import { NextApiRequest, NextApiResponse } from 'next';
import { getSubjectGroups } from '@/app/lib/tools/getSubjectGroups';
import { getSelectSubjects} from '@/app/lib/tools/getSelectsubject';
import { getInterestsFromSelectedSubjects } from '@/app/lib/tools/getInterestsFromSelectedSubjects'; // Corrected import
import { getCoursesByInterest } from '@/app/lib/tools/getCoursesByInterest';
import { getCollegesByCourse } from '@/app/lib/tools/getCollegesByCourse';
import { getExamsByCollege } from '@/app/lib/tools/getExamsByCollege';
import { getCutoffForExam } from '@/app/lib/tools/getCutoffForExam';
import { getCareerPathSummary } from '@/app/lib/tools/getCareerPathSummary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tool, input }: { tool: string; input?: any } = req.body;

  try {
    switch (tool) {
      case 'subject_group':
        return res.json(await getSubjectGroups());

      case 'subject':
        return res.json(await getSelectSubjects(input as string));

      case 'interest':
        // getInterestsFromSelectedSubjects expects string[] for selectedSubjects
        return res.json(await getInterestsFromSelectedSubjects(input as string[])); // CORRECTED

      case 'course':
        // getCoursesByInterest expects an object { interest: string[], group: string }
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

      default:
        return res.status(400).json({ error: 'Invalid tool name' });
    }
  } catch (error: any) {
    console.error("API Tool Error:", error);
    return res.status(500).json({ error: `Server error while processing tool '${tool}': ${error.message}` });
  }
}