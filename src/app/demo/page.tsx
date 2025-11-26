"use client";

import { useLaunchParams, viewport } from "@telegram-apps/sdk-react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Rocket, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useBackButton } from "~/hooks/use-back-button";
import { useMainButton } from "~/hooks/use-main-button";
import { api } from "../../../convex/_generated/api";
import { demoAction } from "./actions";

export default function DemoPage() {
  const launchParams = useLaunchParams();
  const [newPostName, setNewPostName] = useState("");

  // Convex queries and mutations
  const posts = useQuery(api.posts.getAllPosts);
  const createPost = useMutation(api.posts.createPost);

  const handleClick = () => {
    alert("hi");

    console.log({
      viewport: {
        h: viewport.height(),
        w: viewport.width(),
      },
      tgWebAppData: launchParams.tgWebAppData,
      tgWebAppThemeParams: launchParams.tgWebAppThemeParams,
    });
  };

  const handleCreatePost = async () => {
    if (!newPostName.trim()) return;

    try {
      await createPost({ name: newPostName });
      setNewPostName("");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  useMainButton(handleClick);
  useBackButton();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-8">
      <h1 className="text-3xl font-bold">Demo</h1>

      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          This is a client-side rendered page. It activates the
          &quot;native&quot; main button provided by Telegram.{" "}
        </p>
        <p>
          The &ldquo;Authorized Action&rdquo; triggers a server action which
          returns message based on if the authentication is successful.
        </p>
        <p>Below is a demo of Convex integration with real-time posts.</p>
      </div>

      {/* Convex Posts Example */}
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts (Convex Demo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter post name..."
                value={newPostName}
                onChange={(e) => setNewPostName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreatePost()}
              />
              <Button onClick={handleCreatePost} size="sm" className="gap-1">
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {posts === undefined ? (
                <p className="text-sm text-muted-foreground">
                  Loading posts...
                </p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No posts yet. Create one!
                </p>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="p-2 bg-muted rounded text-sm">
                    <p className="font-medium">{post.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Undo2 className="size-4" /> Home
          </Button>
        </Link>
        <Button
          onClick={async () => {
            const result = await demoAction();
            alert(result.message);
          }}
          className="gap-2"
        >
          <Rocket className="size-4" /> Authorized Action
        </Button>
      </div>
    </div>
  );
}
