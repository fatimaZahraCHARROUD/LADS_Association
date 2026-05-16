import { Injectable } from '@nestjs/common';
import cloudinary from '../config/cloudinary';

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'general',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    if (!publicId) return;

    return cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string) {
    if (!url) return null;

    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];

      return `general/${fileName.split('.')[0]}`;
    } catch {
      return null;
    }
  }
}