import { Octokit } from 'octokit'

export interface GitHubRepo {
  owner: string
  repo: string
}

export interface PullRequest {
  number: number
  title: string
  state: string
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
}

export interface PullRequestFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export interface Commit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  html_url: string
}

export class GitHubClient {
  private octokit: Octokit | null = null
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    this.octokit = new Octokit({ auth: token })
  }

  isAuthenticated(): boolean {
    return this.octokit !== null
  }

  async listPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<PullRequest[]> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: 30,
      sort: 'updated',
      direction: 'desc'
    })

    return response.data as PullRequest[]
  }

  async getPullRequest(owner: string, repo: string, pull_number: number): Promise<PullRequest> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number
    })

    return response.data as PullRequest
  }

  async getPullRequestDiff(owner: string, repo: string, pull_number: number): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: {
        format: 'diff'
      }
    })

    return response.data as unknown as string
  }

  async getPullRequestFiles(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<PullRequestFile[]> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
      per_page: 100
    })

    return response.data as PullRequestFile[]
  }

  async getCommits(
    owner: string,
    repo: string,
    per_page: number = 30
  ): Promise<Commit[]> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page
    })

    return response.data as Commit[]
  }

  async getCommitDiff(owner: string, repo: string, ref: string): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.repos.getCommit({
      owner,
      repo,
      ref,
      mediaType: {
        format: 'diff'
      }
    })

    return response.data as unknown as string
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const params: any = {
      owner,
      repo,
      path
    }

    if (ref) {
      params.ref = ref
    }

    const response = await this.octokit.rest.repos.getContent(params)

    if ('content' in response.data && typeof response.data.content === 'string') {
      return Buffer.from(response.data.content, 'base64').toString('utf-8')
    }

    throw new Error('File content not found or invalid')
  }

  async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
      mediaType: {
        format: 'diff'
      }
    })

    return response.data as unknown as string
  }

  async verifyAuthentication(): Promise<{ login: string; name: string; avatar_url: string }> {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated. Please set a token first.')
    }

    const response = await this.octokit.rest.users.getAuthenticated()
    return {
      login: response.data.login,
      name: response.data.name || response.data.login,
      avatar_url: response.data.avatar_url
    }
  }
}

export const githubClient = new GitHubClient()
