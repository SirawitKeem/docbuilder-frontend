import ProfileForm from "@/components/profile/ProfileForm";

export default function NewProfileDataPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">New Data Preset</h1>
        <p className="text-sm text-muted-foreground">
          Configure reusable entity data and default values to auto-populate future documents
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
