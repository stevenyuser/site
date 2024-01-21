import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allProjects } from 'contentlayer/generated'
import type { Project } from 'contentlayer/generated'
import ProjectSimple from '@/layouts/ProjectSimple'
import ProjectBanner from '@/layouts/ProjectBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'

const defaultLayout = 'ProjectBanner'
const layouts = {
  ProjectSimple,
  ProjectBanner,
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata | undefined> {
  const slug = decodeURI(params.slug.join('/'))
  const project = allProjects.find((p) => p.slug === slug)
  if (!project) {
    return
  }

  const publishedAt = new Date(project.date).toISOString()
  const modifiedAt = new Date(project.lastmod || project.date).toISOString()
  let imageList = [siteMetadata.socialBanner]
  if (project.images) {
    imageList = typeof project.images === 'string' ? [project.images] : project.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  const paths = allProjects.map((p) => ({ slug: p.slug.split('/') }))

  return paths
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const slug = decodeURI(params.slug.join('/'))
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allProjects))
  const projectIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (projectIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[projectIndex + 1]
  const next = sortedCoreContents[projectIndex - 1]
  const project = allProjects.find((p) => p.slug === slug) as Project
  const mainContent = coreContent(project)

  const Layout = layouts[project.layout || defaultLayout]

  return (
    <Layout content={mainContent} next={next} prev={prev}>
      <MDXLayoutRenderer code={project.body.code} components={components} toc={project.toc} />
    </Layout>
  )
}
