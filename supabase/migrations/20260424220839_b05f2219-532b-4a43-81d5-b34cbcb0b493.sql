ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contact_invitation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'position_closed';