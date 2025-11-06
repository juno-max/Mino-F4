'use server'

import { db, projects, instructionVersions } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUserWithOrganization } from '@/lib/auth-helpers'

export async function createProject(formData: FormData) {
  const user = await getUserWithOrganization()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const instructions = formData.get('instructions') as string

  if (!name || !instructions) {
    throw new Error('Name and instructions are required')
  }

  const [project] = await db.insert(projects).values({
    organizationId: user.organizationId,
    name,
    description,
    instructions,
  }).returning()

  // Create initial instruction version
  await db.insert(instructionVersions).values({
    projectId: project.id,
    instructions,
    versionNumber: 1,
    changeDescription: 'Initial version',
  })

  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function updateProject(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const instructions = formData.get('instructions') as string
  const changeDescription = formData.get('changeDescription') as string

  const [updated] = await db.update(projects)
    .set({
      name,
      description,
      instructions,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning()

  // Get the latest version number
  const latestVersion = await db.query.instructionVersions.findFirst({
    where: eq(instructionVersions.projectId, id),
    orderBy: (versions, { desc }) => [desc(versions.versionNumber)],
  })

  const nextVersion = (latestVersion?.versionNumber || 0) + 1

  // Create new instruction version if instructions changed
  if (instructions !== updated.instructions) {
    await db.insert(instructionVersions).values({
      projectId: id,
      instructions,
      versionNumber: nextVersion,
      changeDescription: changeDescription || 'Updated instructions',
    })
  }

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id))
  revalidatePath('/projects')
  redirect('/projects')
}
