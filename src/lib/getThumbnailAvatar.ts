export default function getThumbnailAvatar(originalUrl: string): string {
  // Check if the original URL is valid
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    throw new Error('Invalid Cloudinary URL')
  }

  // Split the URL to insert transformation parameters
  const parts = originalUrl.split('/upload/')
  const transformedUrl = `${parts[0]}/upload/w_150,h_150,c_fill,q_auto:low/${parts[1]}`

  return transformedUrl
}
