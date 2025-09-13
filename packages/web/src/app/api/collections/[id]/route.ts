import { NextRequest, NextResponse } from 'next/server';
import { getCollection, updateCollection, deleteCollection, createCollectionSection, deleteCollectionSection } from '@/services/collectionService';

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

  // Update sections if provided
  if (sections && Array.isArray(sections)) {
    // Delete all existing sections first
    const currentCollection = await getCollection(id);
    if (currentCollection?.sections) {
      for (const section of currentCollection.sections) {
        await deleteCollectionSection(section.id);
      }
    }
    
    // Create new sections
    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];
      await createCollectionSection(id, {
        article_id: sectionData.article_id,
        title: sectionData.title,
        description: sectionData.description,
        image: sectionData.image,
        external_url: sectionData.external_url,
        order_index: i
      });
    }
    
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