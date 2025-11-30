// Profile completion utility
export interface UserProfile {
    bio?: string | null;
    profilePic?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface UserBio {
    interest1?: string | null;
    interest2?: string | null;
    interest3?: string | null;
    music?: string | null;
    hobby?: string | null;
}

export interface ProfileCompletionResult {
    percentage: number;
    isComplete: boolean;
    missingFields: string[];
}

export function calculateProfileCompletion(
    user: UserProfile,
    bio: UserBio | null
): ProfileCompletionResult {
    const missingFields: string[] = [];
    let completedFields = 0;
    const totalFields = 8; // bio, profilePic, location (lat+long count as 1), 3 interests, music, hobby

    // Check basic profile fields
    if (user.bio && user.bio.trim().length > 0) {
        completedFields++;
    } else {
        missingFields.push("Bio");
    }

    if (user.profilePic) {
        completedFields++;
    } else {
        missingFields.push("Profile Picture");
    }

    if (user.latitude && user.longitude) {
        completedFields++;
    } else {
        missingFields.push("Location");
    }

    // Check bio fields
    if (bio) {
        if (bio.interest1 && bio.interest1.trim().length > 0) {
            completedFields++;
        } else {
            missingFields.push("Interest 1");
        }

        if (bio.interest2 && bio.interest2.trim().length > 0) {
            completedFields++;
        } else {
            missingFields.push("Interest 2");
        }

        if (bio.interest3 && bio.interest3.trim().length > 0) {
            completedFields++;
        } else {
            missingFields.push("Interest 3");
        }

        if (bio.music && bio.music.trim().length > 0) {
            completedFields++;
        } else {
            missingFields.push("Favorite Music");
        }

        if (bio.hobby && bio.hobby.trim().length > 0) {
            completedFields++;
        } else {
            missingFields.push("Hobby");
        }
    } else {
        missingFields.push("Interest 1", "Interest 2", "Interest 3", "Favorite Music", "Hobby");
    }

    const percentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = percentage === 100;

    return {
        percentage,
        isComplete,
        missingFields,
    };
}
