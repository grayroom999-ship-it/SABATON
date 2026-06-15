import { writeFile, mkdir } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export async function POST(request: NextRequest) {
  // Optional: authenticate using the admin password (adjust as needed)
  const authHeader = request.headers.get('authorization')
  const password = authHeader?.replace('Bearer ', '')
  // Change 'admin123' to your actual admin password
  if (password !== 'admin123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.formData()
  const file = data.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${Date.now()}-${safeName}`
  const uploadDir = path.join(process.cwd(), 'public/uploads')

  try {
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)
    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}