"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations";
import { updateOwnProfileAction, updateOwnProfilePictureAction } from "@/app/(app)/profile/actions";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfileEditForm({
  name,
  phone,
  address,
  profilePicture,
}: {
  name: string;
  phone: string | null;
  address: string | null;
  profilePicture: string | null;
}) {
  const [picture, setPicture] = useState(profilePicture);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { phone: phone ?? "", address: address ?? "" },
  });

  const onSubmit = async (data: ProfileUpdateInput) => {
    const result = await updateOwnProfileAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated.");
  };

  const onPictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await updateOwnProfilePictureAction(formData);
    setUploading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setPicture(result.url);
    toast.success("Profile picture updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            {picture && <AvatarImage src={picture} alt={name} />}
            <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPictureChange}
          />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">JPG, PNG or WEBP. Max 3MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
          {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
        </div>
        <p className="text-xs text-slate-400">
          Only phone, address and profile picture can be edited here. Contact HR/Admin for other changes.
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}
