import { githubClient } from './github'

export interface OrganizationPortalRepository {
  name: string
  visibility: string
  archived: boolean
  fork: boolean
  stargazers_count: number
  forks_count: number
  updated_at: string
}

export interface OrganizationPortalSnapshot {
  repositories: OrganizationPortalRepository[]
  summary: {
    repositoryCount: number
    starCount: number
    forkCount: number
    contributorCount: number
  }
}

export async function getOrganizationPortalSnapshot(orgName: string): Promise<OrganizationPortalSnapshot> {
  const snapshot = await githubClient.getOrganizationSnapshot(orgName)

  return {
    repositories: snapshot.repositories.map((repo) => ({
      name: repo.name,
      visibility: repo.visibility,
      archived: repo.archived,
      fork: repo.fork,
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      updated_at: repo.updated_at,
    })),
    summary: snapshot.summary,
  }
}
