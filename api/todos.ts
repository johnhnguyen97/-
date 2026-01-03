import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  task_type: string;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  due_time?: string;
  priority: number;
  linked_word?: string;
  linked_kanji?: string;
  google_task_id?: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: Request) {
  // Get auth token from header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET - List all todos
    if (req.method === 'GET') {
      const includeCompleted = url.searchParams.get('includeCompleted') !== 'false';
      const limit = parseInt(url.searchParams.get('limit') || '100');

      let query = supabase
        .from('user_calendar_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeCompleted) {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ todos: data || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new todo
    if (req.method === 'POST') {
      const body = await req.json();
      const { title, notes, task_type, due_date, due_time, priority, linked_word, linked_kanji } = body;

      if (!title?.trim()) {
        return new Response(JSON.stringify({ error: 'Title is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('user_calendar_tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          notes: notes?.trim() || null,
          task_type: task_type || 'custom',
          due_date: due_date || null,
          due_time: due_time || null,
          priority: priority ?? 0,
          linked_word: linked_word || null,
          linked_kanji: linked_kanji || null,
          is_completed: false,
          sync_status: 'local',
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ todo: data }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update todo (toggle complete, edit, etc.)
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, title, notes, is_completed, due_date, due_time, priority } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'Todo ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updates.title = title.trim();
      if (notes !== undefined) updates.notes = notes?.trim() || null;
      if (is_completed !== undefined) {
        updates.is_completed = is_completed;
        updates.completed_at = is_completed ? new Date().toISOString() : null;
      }
      if (due_date !== undefined) updates.due_date = due_date || null;
      if (due_time !== undefined) updates.due_time = due_time || null;
      if (priority !== undefined) updates.priority = priority;

      const { data, error } = await supabase
        .from('user_calendar_tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ todo: data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete todo
    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      const clearCompleted = url.searchParams.get('clearCompleted') === 'true';

      if (clearCompleted) {
        // Delete all completed todos
        const { error } = await supabase
          .from('user_calendar_tasks')
          .delete()
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: 'Completed todos cleared' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!id) {
        return new Response(JSON.stringify({ error: 'Todo ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('user_calendar_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Todos API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
