import { Injectable } from '@nestjs/common';
import cloudinary from '../config/cloudinary';

@Injectable()
export class UploadService {
  async uploadImage(file:Express.Multer.File) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'general',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      ).end(file.buffer);
    });
  }
}