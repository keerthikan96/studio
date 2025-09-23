
'use client';

import CreatePostForm from '@/components/create-post-form';
import WorkfeedPost from '@/components/workfeed-post';
import { Member } from '@/lib/mock-data';

// Placeholder data for posts
const mockPosts = [
  {
    id: 'post1',
    author: {
        id: 'admin-user-001',
        name: 'People and Culture office',
        email: 'admin@example.com',
        role: 'HR',
        profile_picture_url: 'https://i.pravatar.cc/40?u=admin',
    },
    content: "🎉 Big congratulations to Sarah on her 5-year work anniversary! Thank you for your dedication and hard work. Here's to many more successful years ahead! 🥂",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 15,
    comments: [
      { authorName: 'John Doe', text: 'Congratulations, Sarah!' },
      { authorName: 'Jane Smith', text: 'Well deserved! 🎉' },
    ],
  },
  {
    id: 'post3',
    author: {
        id: 'admin-user-001',
        name: 'People and Culture office',
        email: 'admin@example.com',
        role: 'HR',
        profile_picture_url: 'https://i.pravatar.cc/40?u=admin-bot',
    },
    content: "Happy Birthday, Jessica Singh! Wishing you a fantastic day! 🎂",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    imageUrl: 'https://storage.googleapis.com/gemini-studio-assets-dev/workfeed-birthday-2.png',
    likes: 28,
    comments: [
       { authorName: 'Emily Carter', text: 'Happy Birthday, Alex!' },
    ],
  },
  {
    id: 'post2',
     author: {
        id: 'm_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        profile_picture_url: 'https://i.pravatar.cc/40?u=m_1',
    } as Member,
    content: "Excited to share that we've just launched the new project dashboard! A huge thanks to the entire team for their hard work. Go check it out and let us know what you think!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    likes: 42,
    comments: [],
  },
];


export default function WorkfeedPage() {
    const handleCreatePost = (content: string) => {
        console.log('Creating post:', content);
        // Here you would call a server action to save the post
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Workfeed</h1>
            <CreatePostForm onCreatePost={handleCreatePost} />
            <div className="space-y-4">
                {mockPosts.map((post) => (
                    <WorkfeedPost key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
