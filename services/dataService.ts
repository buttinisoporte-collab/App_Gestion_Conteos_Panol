
import { getSupabase } from '../lib/supabase';
import { WeekData, Item, WeekStatus, AppState, CountCycle, User, AuditLogEntry } from '../types';

export const dataService = {
  async getUsers(): Promise<User[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    // Map DB fields to User type
    return data.map(u => ({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role,
      fullName: u.full_name,
      dni: u.dni,
      employeeId: u.employee_id,
      status: u.status,
      mustChangePassword: u.must_change_password,
      auditLog: [] // We'll fetch this separately if needed or just leave empty for list
    }));
  },

  async saveUser(user: User): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        full_name: user.fullName,
        dni: user.dni,
        employee_id: user.employeeId,
        status: user.status,
        must_change_password: user.mustChangePassword
      });

    if (error) {
      console.error('Error saving user:', error);
      return false;
    }
    return true;
  },

  async getCurrentCount(): Promise<CountCycle | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Fetch the non-archived count cycle
    const { data: cycleData, error: cycleError } = await supabase
      .from('count_cycles')
      .select('*')
      .eq('archived', false)
      .maybeSingle();

    if (cycleError || !cycleData) return null;

    // Fetch all weeks for this cycle in one query
    const { data: weeksData, error: weeksError } = await supabase
      .from('weeks')
      .select('*')
      .eq('cycle_id', cycleData.id)
      .order('start_date', { ascending: true });

    if (weeksError || !weeksData) return null;

    if (weeksData.length === 0) {
      return {
        id: cycleData.id,
        name: cycleData.name,
        startDate: cycleData.start_date,
        endDate: cycleData.end_date,
        creationDate: cycleData.creation_date,
        weeks: []
      };
    }

    // Fetch all items for all weeks in this cycle in one query
    const weekIds = weeksData.map(w => w.id);
    const { data: allItemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .in('week_id', weekIds);

    if (itemsError) return null;

    const itemsByWeek = (allItemsData || []).reduce((acc: any, item: any) => {
      if (!acc[item.week_id]) acc[item.week_id] = [];
      acc[item.week_id].push({
        id: item.id,
        description: item.description,
        manufacturerCode: item.manufacturer_code,
        category: item.category,
        location: item.location,
        systemStock: item.system_stock,
        quantity: item.quantity,
        countedDate: item.counted_date,
        countedBy: item.counted_by,
        materialId: item.material_id
      });
      return acc;
    }, {});

    const weeks: WeekData[] = weeksData.map(w => ({
      id: w.id,
      name: w.name,
      startDate: w.start_date,
      endDate: w.end_date,
      status: w.status as WeekStatus,
      finalizationObservation: w.finalization_observation,
      finalizedBy: w.finalized_by,
      finalizationDate: w.finalization_date,
      lastModifiedBy: w.last_modified_by,
      lastModifiedDate: w.last_modified_date,
      items: itemsByWeek[w.id] || []
    }));

    return {
      id: cycleData.id,
      name: cycleData.name,
      startDate: cycleData.start_date,
      endDate: cycleData.end_date,
      creationDate: cycleData.creation_date,
      weeks: weeks
    };
  },

  async saveCountCycle(cycle: CountCycle): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    // 1. Save Cycle
    const { error: cycleError } = await supabase
      .from('count_cycles')
      .upsert({
        id: cycle.id,
        name: cycle.name,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        creation_date: cycle.creationDate,
        archived: false
      });

    if (cycleError) return false;

    // 2. Save Weeks
    for (const week of cycle.weeks) {
      const { error: weekError } = await supabase
        .from('weeks')
        .upsert({
          id: week.id,
          cycle_id: cycle.id,
          name: week.name,
          start_date: week.startDate,
          end_date: week.endDate,
          status: week.status,
          finalization_observation: week.finalizationObservation,
          finalized_by: week.finalizedBy,
          finalization_date: week.finalizationDate,
          last_modified_by: week.lastModifiedBy,
          last_modified_date: week.lastModifiedDate
        });

      if (weekError) continue;

      // 3. Save Items
      const itemsToUpsert = week.items.map(item => ({
        id: item.id,
        week_id: week.id,
        material_id: item.materialId || item.id,
        description: item.description,
        manufacturer_code: item.manufacturerCode,
        category: item.category,
        location: item.location,
        system_stock: item.systemStock,
        quantity: item.quantity,
        counted_date: item.countedDate,
        counted_by: item.countedBy
      }));

      await supabase.from('items').upsert(itemsToUpsert);
    }

    return true;
  },

  async updateItem(weekId: string, item: Item, userFullName: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('items')
      .update({
        quantity: item.quantity,
        counted_date: item.countedDate,
        counted_by: userFullName
      })
      .eq('id', item.id);

    if (error) return false;

    // Update week last modified
    await supabase
      .from('weeks')
      .update({
        last_modified_by: userFullName,
        last_modified_date: new Date().toISOString(),
        status: WeekStatus.EnProgreso
      })
      .eq('id', weekId);

    return true;
  },

  async getHistoricalCounts(): Promise<CountCycle[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: cycles, error } = await supabase
      .from('count_cycles')
      .select('*')
      .eq('archived', true)
      .order('creation_date', { ascending: false });

    if (error) return [];

    // For brevity, we might not fetch all weeks/items for the list view
    // but the type requires them. In a real app, we'd fetch on demand.
    return cycles.map(c => ({
      id: c.id,
      name: c.name,
      startDate: c.start_date,
      endDate: c.end_date,
      creationDate: c.creation_date,
      weeks: [] // Placeholder
    }));
  },

  async archiveCountCycle(cycleId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('count_cycles')
      .update({ archived: true })
      .eq('id', cycleId);

    return !error;
  }
};
