import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';

export interface CameraPhoto {
  base64String?: string;
  dataUrl?: string;
  webPath?: string;
  format: string;
}

export const useNativeCamera = () => {
  const [photo, setPhoto] = useState<CameraPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const takePhoto = useCallback(async (): Promise<CameraPhoto | null> => {
    setLoading(true);
    setError(null);

    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      const result: CameraPhoto = {
        base64String: image.base64String,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        webPath: image.webPath,
        format: image.format,
      };

      setPhoto(result);
      return result;
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Erro ao tirar foto';
      setError(errorMessage);
      console.error('Camera error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const pickFromGallery = useCallback(async (): Promise<CameraPhoto | null> => {
    setLoading(true);
    setError(null);

    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      const result: CameraPhoto = {
        base64String: image.base64String,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        webPath: image.webPath,
        format: image.format,
      };

      setPhoto(result);
      return result;
    } catch (err: unknown) {
      const errorMessage = err.message || 'Erro ao selecionar foto';
      setError(errorMessage);
      console.error('Gallery error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const status = await Camera.checkPermissions();
      return status;
    } catch (err) {
      console.error('Permission check error:', err);
      return null;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const status = await Camera.requestPermissions();
      return status;
    } catch (err) {
      console.error('Permission request error:', err);
      return null;
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    photo,
    loading,
    error,
    isNative,
    takePhoto,
    pickFromGallery,
    checkPermissions,
    requestPermissions,
    clearPhoto,
  };
};
