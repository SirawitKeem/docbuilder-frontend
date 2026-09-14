"use client";

import { useEffect, useState, use } from "react";
import ProfileForm from "@/components/profile/ProfileForm";
import { getFieldProfile } from "@/lib/data/fieldProfiles";

export default function EditProfileDataPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getFieldProfile(id).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Edit Data Preset</h1>
        <div className="h-64 rounded-card bg-muted animate-pulse mt-6" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-muted-foreground">Data preset not found in the system</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Edit Data Preset: {profile.name}</h1>
        <p className="text-sm text-muted-foreground">
          Update reusable field values and associated document templates
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
