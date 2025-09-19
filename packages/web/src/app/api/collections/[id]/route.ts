import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  updateCollection,
  deleteCollection,
  updateCollectionSections,
  type SectionUpdateData
} from '@/services/collections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const collection = await getCollection(id);
  
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }
  
  return NextResponse.json(collection);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const { sections, ...updates } = await request.json();
  
  // Update collection basic info
  const collection = await updateCollection(id, updates);
  
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  // Update sections if provided (using intelligent updates)
  if (sections && Array.isArray(sections)) {
    // Transform sections to include order_index and proper typing
    const sectionsWithOrder: SectionUpdateData[] = sections.map((section, index) => ({
      id: section.id, // May be undefined for new sections
      article_id: section.article_id,
      title: section.title,
      description: section.description,
      image: section.image,
      external_url: section.external_url,
      tag_names: section.tag_names,
      order_index: index
    }));

    // Use intelligent update - only changes what's necessary
    await updateCollectionSections(id, sectionsWithOrder);

    // Refetch collection with sections
    const updatedCollection = await getCollection(id);
    return NextResponse.json(updatedCollection);
  }
  
  return NextResponse.json(collection);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await deleteCollection(id);
  
  return NextResponse.json({ success: true });
}