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
  const { tool, input } = req.body;

  try {
    switch (tool) {
      case 'subject_group':
        return res.json(await getSubjectGroups());
      case 'subject':
        return res.json(await getSelectSubjects(input));
      case 'interest':
        return res.json(await getInterestsByGroup(input));
      case 'course':
        return res.json(await getCoursesByInterest(input.interest, input.group));
      case 'college':
        return res.json(await getCollegesByCourse(input));
      case 'exam':
        return res.json(await getExamsByCollege(input.college, input.course));
      case 'cutoff':
        return res.json(await getCutoffForExam(input.exam, input.college));
      case 'summary':
        return res.json(await getCareerPathSummary(input));
      default:
        return res.status(400).json({ error: 'Invalid tool name' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}