import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads', 'members');

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const multerOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only images are allowed.'), false);
    }
  },
  storage: diskStorage({
    destination: (req: any, file, cb) => cb(null, uploadDir),
    filename: (req: any, file: Express.Multer.File, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `MEM-${unique}${extname(file.originalname)}`);
    },
  }),
};