import ImageUploadWithCrop from './ImageUploadWithCrop';
import {
  PRODUCT_IMAGE_ASPECT,
  PRODUCT_IMAGE_RECOMMENDED_LABEL,
  PRODUCT_IMAGE_RECOMMENDED_NOTE,
} from '../../constants/productImages';

export default function ProductImageUploader({ images = [], onChange, maxImages = 12, onError }) {
  return (
    <ImageUploadWithCrop
      mode="multiple"
      value={images}
      onChange={onChange}
      bucket="product-images"
      aspect={PRODUCT_IMAGE_ASPECT}
      recommendedSize={PRODUCT_IMAGE_RECOMMENDED_LABEL}
      recommendedSizeNote={PRODUCT_IMAGE_RECOMMENDED_NOTE}
      label="Product images *"
      maxImages={maxImages}
      onError={onError}
    />
  );
}
