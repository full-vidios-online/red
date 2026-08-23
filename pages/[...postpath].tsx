import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const endpoint = 'https://dfhndrfh.infinityfree.me/graphql';
	const graphQLClient = new GraphQLClient(endpoint);

	const referringURL = ctx.req.headers?.referer || null;

	const pathArr = ctx.query.postpath;
	const path = Array.isArray(pathArr)
		? pathArr.join('/')
		: (pathArr || '');

	const fbclid = ctx.query.fbclid;

	if (referringURL?.includes('facebook.com') || fbclid) {
		return {
			redirect: {
				permanent: false,
				destination: `https://saveourstateok.org/${encodeURI(path)}`,
			},
		};
	}

	const query = gql`
		{
			post(id: "/${path}/", idType: URI) {
				id
				excerpt
				title
				link
				dateGmt
				modifiedGmt
				content
				author {
					node {
						name
					}
				}
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
			}
		}
	`;

	try {
		const data = await graphQLClient.request(query);

		if (!data?.post) {
			return {
				notFound: true,
			};
		}

		return {
			props: {
				path,
				post: data.post,
				host: ctx.req.headers.host || '',
			},
		};
	} catch (error) {
		console.error(error);

		return {
			notFound: true,
		};
	}
};

interface PostProps {
	post: any;
	host: string;
	path: string;
}

const Post: React.FC<PostProps> = ({ post, host }) => {
	const removeTags = (str: string) => {
		if (!str) return '';

		return str
			.toString()
			.replace(/(<([^>]+)>)/gi, '')
			.replace(/\[[^\]]*\]/g, '');
	};

	const imageUrl = post?.featuredImage?.node?.sourceUrl;

	return (
		<>
			<Head>
				<title>{post.title}</title>

				<meta property="og:title" content={post.title} />
				<meta
					property="og:description"
					content={removeTags(post.excerpt)}
				/>
				<meta property="og:type" content="article" />
				<meta property="og:locale" content="en_US" />
				<meta
					property="og:site_name"
					content={host?.split('.')[0] || 'Website'}
				/>
				<meta
					property="article:published_time"
					content={post.dateGmt}
				/>
				<meta
					property="article:modified_time"
					content={post.modifiedGmt}
				/>

				{imageUrl && (
					<>
						<meta property="og:image" content={imageUrl} />
						<meta
							property="og:image:alt"
							content={
								post?.featuredImage?.node?.altText ||
								post.title
							}
						/>
					</>
				)}
			</Head>

			<div className="post-container">
				<h1>{post.title}</h1>

				{imageUrl && (
					<Image
						src={imageUrl}
						alt={
							post?.featuredImage?.node?.altText ||
							post.title
						}
						width={1200}
						height={630}
						priority
						style={{
							width: '100%',
							height: 'auto',
							maxWidth: '100%',
						}}
					/>
				)}

				<article
					dangerouslySetInnerHTML={{
						__html: post.content,
					}}
				/>
			</div>
		</>
	);
};

export default Post;
