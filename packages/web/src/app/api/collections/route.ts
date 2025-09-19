import { NextRequest, NextResponse } from 'next/server';
import { getCollections, createCollection, createCollectionSection, getCollection } from '@/services/collectionService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  const result = await getCollections({ status, limit, offset });
  
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { title, description, cover_image, status, sections } = body;
  
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Create collection
  const collection = await createCollection({
    title: title.trim(),
    description,
    cover_image,
    status: status || 'draft'
  });

  // Create sections if provided
  if (sections && Array.isArray(sections)) {
    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];
      await createCollectionSection(collection.id, {
        article_id: sectionData.article_id,
        title: sectionData.title,
        description: sectionData.description,
        image: sectionData.image,
        external_url: sectionData.external_url,
        tag_names: sectionData.tag_names,
        order_index: i
      });
    }
    
    // Refetch collection with sections
    const collectionWithSections = await getCollection(collection.id);
    return NextResponse.json(collectionWithSections, { status: 201 });
  }

  return NextResponse.json(collection, { status: 201 });
}