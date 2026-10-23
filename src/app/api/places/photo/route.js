import { NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/constants';
import { boundedFetch,boundedJson } from '@/lib/http.mjs';
import { verifyPhoto } from '@/lib/google/photo-signature.mjs';

// Only app-signed photo names can spend the server's Places allowance.
export async function GET(request) {
  const url=new URL(request.url),name=url.searchParams.get('name'),width=Number(url.searchParams.get('w')||1200);
  if(!FEATURE_FLAGS.googlePlacesLive())return new NextResponse(null,{status:404});
  if(!verifyPhoto(name,width,url.searchParams.get('sig'),process.env.GOOGLE_PLACES_API_KEY))return new NextResponse(null,{status:400});
  try {
    const metadata=await boundedFetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&skipHttpRedirect=true`,{headers:{'X-Goog-Api-Key':process.env.GOOGLE_PLACES_API_KEY}});
    if(!metadata.ok)return new NextResponse(null,{status:502});
    const {photoUri}=await boundedJson(metadata,20000);const photo=new URL(photoUri);
    if(photo.protocol!=='https:'||!/^lh\d+\.googleusercontent\.com$/.test(photo.hostname)||photo.port||photo.username||photo.password)return new NextResponse(null,{status:502});
    // Never forward the API key to the image host, even on a redirect.
    const response=await boundedFetch(photo,{redirect:'error'});
    if(!response.ok||!/^image\/(jpeg|png|webp|gif|avif)(;|$)/i.test(response.headers.get('content-type')||''))return new NextResponse(null,{status:502});
    return new NextResponse(response.body,{headers:{'Content-Type':response.headers.get('content-type'),'Cache-Control':'public, max-age=3600, s-maxage=86400','X-Content-Type-Options':'nosniff'}});
  } catch {return new NextResponse(null,{status:502});}
}
