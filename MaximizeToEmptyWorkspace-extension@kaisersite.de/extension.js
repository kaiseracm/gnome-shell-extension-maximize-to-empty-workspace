/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
const Meta = imports.gi.Meta;
const Gio = imports.gi.Gio;
//  _mutterSettings.get_boolean('workspaces-only-on-primary');
//  _mutterSettings.get_boolean('dynamic-workspaces');

const _handles = [];


class Extension {
 
    constructor() {
      this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
    }
    
    // First free workspace on the specified monitor
    getFirstFreeMonitor(manager,mMonitor) {
        const n = manager.get_n_workspaces();
        for (let i = 0; i < n; i++) 
        {
            let win_count = manager.get_workspace_by_index(i).list_windows().filter(w => !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor).length;
            if (win_count < 1) 
                return i; 
        }
        return -1;
    }
    
    // First free workspace on the specified monitor
    getLastOcupiedMonitor(manager,nCurrent,mMonitor) {
        for (let i = nCurrent; i >= 0; i--) 
        {
            let win_count = manager.get_workspace_by_index(i).list_windows().filter(w => !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor).length;
            if (win_count > 0) 
                return i;
        }
        const n = manager.get_n_workspaces();
        for (let i = nCurrent + 1; i < n; i++) 
        {
            let win_count = manager.get_workspace_by_index(i).list_windows().filter(w => !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor).length;
            if (win_count > 0) 
                return i; 
        }
        return -1;
    }
    
    check(act,bMap) {
        // it doesn't matter if we have dynamic workspaces or not, so don't use this:
        //if (!this._mutterSettings.get_boolean('dynamic-workspaces')) 
        //    return;
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
            return;
        if (win.is_always_on_all_workspaces())
            return;

        // Idea: don't move the coresponding window to an other workspace (it may be not fully active yet)
        // Reorder the workspaces and move all other window

        const mMonitor=win.get_monitor();
        const wList = win.get_workspace().list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor);
        if (wList.length >= 1) 
            {
            const manager = win.get_display().get_workspace_manager();
            const current = manager.get_active_workspace_index();
            if (this._mutterSettings.get_boolean('workspaces-only-on-primary'))
                {
                const mPrimary=win.get_display().get_primary_monitor();
                // Only primary monitor is relevant, others don't have multiple workspaces
                if (mMonitor!=mPrimary) 
                    return;
                const firstfree=this.getFirstFreeMonitor(manager,mMonitor);
                // No free monitor: do nothing
                if (firstfree==-1)
                    return;
                if (current<firstfree)
                    {
                    if (bMap)
                        {
                        // show new window on next free monitor (last on dynamic workspaces)
                        manager.reorder_workspace(manager.get_workspace_by_index(firstfree),current);
                        manager.reorder_workspace(manager.get_workspace_by_index(current+1),firstfree);
                        // move the other windows to their old places
                        wList.forEach( w => {w.change_workspace_by_index(current, false);});
                        }
                    else
                        {
                        // insert existing window on next monitor (each other workspace is moved one index further)
                        manager.reorder_workspace(manager.get_workspace_by_index(firstfree),current);
                        // move the other windows to their old places
                        wList.forEach( w => {w.change_workspace_by_index(current, false);});
                        }
                    }
                else if (current>firstfree)
                    {
                    // show window on next free monitor (doesn't happen with dynamic workspaces)
                    manager.reorder_workspace(manager.get_workspace_by_index(current),firstfree);
                    manager.reorder_workspace(manager.get_workspace_by_index(firstfree+1),current);
                    // move the other windows to their old places
                    wList.forEach( w => {w.change_workspace_by_index(current, false);});
                    }
                }
            else
                {
                // All monitors have workspaces
                // search the workspaces for a free monitor on the same index
                const firstfree=this.getFirstFreeMonitor(manager,mMonitor);
                // No free monitor: do nothing
                if (firstfree==-1)
                    return;
                // show the window on the workspace with the empty monitor
                const wListcurrent = win.get_workspace().list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces());
                const wListfirstfree = manager.get_workspace_by_index(firstfree).list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces());
                if (current<firstfree)
                    {
                    manager.reorder_workspace(manager.get_workspace_by_index(firstfree),current);
                    manager.reorder_workspace(manager.get_workspace_by_index(current+1),firstfree);
                    // move the other windows to their old places
                    wListcurrent.forEach( w => {w.change_workspace_by_index(current, false);});
                    wListfirstfree.forEach( w => {w.change_workspace_by_index(firstfree, false);});
                    }
                else if (current>firstfree)
                    {
                    manager.reorder_workspace(manager.get_workspace_by_index(current),firstfree);
                    manager.reorder_workspace(manager.get_workspace_by_index(firstfree+1),current);
                    // move the other windows to their old places
                    wListcurrent.forEach( w => {w.change_workspace_by_index(current, false);});
                    wListfirstfree.forEach( w => {w.change_workspace_by_index(firstfree, false);});
                    }
                }
            }
        //log("wList "+ wList.length +" "+ text)
    }

    backto(act) {
        // it doesn't matter if we have dynamic workspaces or not, so don't use this:
        //if (!this._mutterSettings.get_boolean('dynamic-workspaces')) 
        //    return;
        const win = act.meta_window;
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        // Idea: don't move the coresponding window to an other workspace (it may be not fully active yet)
        // Reorder the workspaces and move all other window

        const mMonitor=win.get_monitor();
        const wList = win.get_workspace().list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor);
        if (wList.length == 0) 
            {
            const manager = win.get_display().get_workspace_manager();
            const current = manager.get_active_workspace_index();
            //log("wList current "+ current);
            if (this._mutterSettings.get_boolean('workspaces-only-on-primary'))
                {
                const mPrimary=win.get_display().get_primary_monitor();
                // Only primary monitor is relevant, others don't have multiple workspaces
                if (mMonitor!=mPrimary) 
                    return;
                const lastocupied=this.getLastOcupiedMonitor(manager,current,mMonitor);
                // No occupied monitor: do nothing
                //log("lastocupied "+ lastocupied);
                if (lastocupied==-1)
                    return;
                const wListlastoccupied = manager.get_workspace_by_index(lastocupied).list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor);
                // switch workspace position to last with windows and move all windows there
                manager.reorder_workspace(manager.get_workspace_by_index(current),lastocupied);
                wListlastoccupied.forEach( w => {w.change_workspace_by_index(lastocupied, false);});
                }
            else
                {
                const lastocupied=this.getLastOcupiedMonitor(manager,current,mMonitor);
                // No occupied monitor: do nothing
                if (lastocupied==-1)
                    return;
                const wListcurrent = win.get_workspace().list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces());
                if (wListcurrent.length > 0) 
                    return;
                const wListlastoccupied = manager.get_workspace_by_index(lastocupied).list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces());
                // switch workspace position to last with windows and move all windows there
                manager.reorder_workspace(manager.get_workspace_by_index(current),lastocupied);
                wListlastoccupied.forEach( w => {w.change_workspace_by_index(lastocupied, false);});
                }
            }
        //log("wList destroy "+ wList.length);
    }
    
    enable() {
        // Trigger new window with maximize size and if the window is maximized
        _handles.push(global.window_manager.connect('map', (_, act) => {this.check(act,true);}));
        _handles.push(global.window_manager.connect('destroy', (_, act) => {this.backto(act);}));
        _handles.push(global.window_manager.connect('size-change', (_, act, change) => {
            if (change === Meta.SizeChange.MAXIMIZE)
                this.check(act,false);
        }));
   }

    disable() {
        // remove array and disconect
        _handles.splice(0).forEach(h => global.window_manager.disconnect(h));
    }
}

function init() {
    return new Extension();
}
