import { VercelRequest, VercelResponse } from '@vercel/node';
import { BlogModel } from '../../models/BlogModel';
import { PostModel } from '../../models/PostModel';
import { connectDB } from '../../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).send('Method Not Allowed');
  }

  await connectDB();

  try {
    await Promise.all([
      BlogModel.deleteMany({}),
      PostModel.deleteMany({})
    ]);
    res.status(204).send('');
  } catch (e) {
    console.error('Error deleting data', e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
