/*
# ProjectOS Phase 6: Collaboration tables

- task_watchers: users watching tasks
- comment_mentions: structured mention records
- notifications: user notifications
- activity_events: audit trail of meaningful actions
- notification_preferences: per-user notification settings
*/

-- ============================================================
-- TASK WATCHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_watchers (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_watchers_user_id ON public.task_watchers(user_id);

DROP POLICY IF EXISTS "select_member_task_watchers" ON public.task_watchers;
CREATE POLICY "select_member_task_watchers" ON public.task_watchers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_watchers.task_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_task_watcher" ON public.task_watchers;
CREATE POLICY "insert_own_task_watcher" ON public.task_watchers
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_watchers.task_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_task_watcher" ON public.task_watchers;
CREATE POLICY "delete_own_task_watcher" ON public.task_watchers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- COMMENT MENTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, mentioned_user_id)
);

ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_mentioned_user_id ON public.comment_mentions(mentioned_user_id);

DROP POLICY IF EXISTS "select_member_comment_mentions" ON public.comment_mentions;
CREATE POLICY "select_member_comment_mentions" ON public.comment_mentions
  FOR SELECT TO authenticated
  USING (
    mentioned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.tasks t ON t.id = c.task_id
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE c.id = comment_mentions.comment_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_member_comment_mentions" ON public.comment_mentions;
CREATE POLICY "insert_member_comment_mentions" ON public.comment_mentions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.tasks t ON t.id = c.task_id
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE c.id = comment_mentions.comment_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_comment_mentions" ON public.comment_mentions;
CREATE POLICY "delete_member_comment_mentions" ON public.comment_mentions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.tasks t ON t.id = c.task_id
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE c.id = comment_mentions.comment_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications(workspace_id);

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "insert_member_notifications" ON public.notifications;
CREATE POLICY "insert_member_notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = notifications.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;
CREATE POLICY "delete_own_notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (recipient_id = auth.uid());

-- ============================================================
-- ACTIVITY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_events_workspace_id ON public.activity_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_project_id ON public.activity_events(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_task_id ON public.activity_events(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);

DROP POLICY IF EXISTS "select_member_activity_events" ON public.activity_events;
CREATE POLICY "select_member_activity_events" ON public.activity_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = activity_events.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_member_activity_events" ON public.activity_events;
CREATE POLICY "insert_member_activity_events" ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = activity_events.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  task_assignments boolean NOT NULL DEFAULT true,
  mentions boolean NOT NULL DEFAULT true,
  comments boolean NOT NULL DEFAULT true,
  due_dates boolean NOT NULL DEFAULT true,
  project_activity boolean NOT NULL DEFAULT true,
  sprint_activity boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "select_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "select_own_notification_preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "insert_own_notification_preferences" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "update_own_notification_preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
