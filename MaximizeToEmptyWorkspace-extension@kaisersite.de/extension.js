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
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
//  _mutterSettings.get_boolean('workspaces-only-on-primary');
//  _mutterSettings.get_boolean('dynamic-workspaces');

const _handles = [];

const _windowids_maximized = {};
const _windowids_size_change = {};

export default class Extension {
 
    constructor() {
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
    
    // last occupied workspace on the specified monitor
    getLastOcupiedMonitor(manager,nCurrent,mMonitor) {
        for (let i = nCurrent-1; i >= 0; i--) 
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
    
    placeOnWorkspace(win) {
        //console.log("achim","placeOnWorkspace:"+win.get_id());
        // bMap true - new windows to end of workspaces
        const bMap = false;

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
                        // alternative, works too
                        //win.change_workspace_by_index(firstfree, false);
                        //manager.reorder_workspace(manager.get_workspace_by_index(firstfree),current+1);
                        //manager.get_workspace_by_index(current+1).activate(global.get_current_time());
                        
                        // insert existing window on next monitor (each other workspace is moved one index further)
                        manager.reorder_workspace(manager.get_workspace_by_index(firstfree),current);
                        // move the other windows to their old places
                        wList.forEach( w => {w.change_workspace_by_index(current, false);});
                        }
                    // remember reordered window
                    _windowids_maximized[win.get_id()] = "reorder";
                    }
                else if (current>firstfree)
                    {
                    // show window on next free monitor (doesn't happen with dynamic workspaces)
                    manager.reorder_workspace(manager.get_workspace_by_index(current),firstfree);
                    manager.reorder_workspace(manager.get_workspace_by_index(firstfree+1),current);
                    // move the other windows to their old places
                    wList.forEach( w => {w.change_workspace_by_index(current, false);});
                    // remember reordered window
                    _windowids_maximized[win.get_id()] = "reorder";
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
                    // remember reordered window
                    _windowids_maximized[win.get_id()] = "reorder";
                    }
                else if (current>firstfree)
                    {
                    manager.reorder_workspace(manager.get_workspace_by_index(current),firstfree);
                    manager.reorder_workspace(manager.get_workspace_by_index(firstfree+1),current);
                    // move the other windows to their old places
                    wListcurrent.forEach( w => {w.change_workspace_by_index(current, false);});
                    wListfirstfree.forEach( w => {w.change_workspace_by_index(firstfree, false);});
                    // remember reordered window
                    _windowids_maximized[win.get_id()] = "reorder";
                    }
                }
            }
    }

    // back to last workspace
    backto(win) {

        //console.log("achim","backto "+win.get_id());
        
        // Idea: don't move the coresponding window to an other workspace (it may be not fully active yet)
        // Reorder the workspaces and move all other window
        
        if (!(win.get_id() in _windowids_maximized))
            {
            // no new screen is used in the past: do nothing
            return;
            }
        
        // this is not longer maximized
        delete _windowids_maximized[win.get_id()];


        const mMonitor=win.get_monitor();
        const wList = win.get_workspace().list_windows().filter(w => w!==win && !w.is_always_on_all_workspaces() && w.get_monitor()==mMonitor);
        if (wList.length == 0) 
            {
            const manager = win.get_display().get_workspace_manager();
            const current = manager.get_active_workspace_index();
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
    }
    
    window_manager_map(act)
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_map "+win.get_id());
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.placeOnWorkspace(win);
    }
    
    window_manager_destroy(act)
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_destroy");
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        this.backto(win);
    }

    window_manager_size_change(act,change,rectold) 
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_size_change "+win.get_id());
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        if (change === Meta.SizeChange.MAXIMIZE)
            {
            //console.log("achim","Meta.SizeChange.MAXIMIZE");
            if (win.get_maximized() === Meta.MaximizeFlags.BOTH)
                {
                //console.log("achim","=== Meta.MaximizeFlags.BOTH");
                _windowids_size_change[win.get_id()]="place";
                }
            }
        else if (change  === Meta.SizeChange.FULLSCREEN)
            {
            //console.log("achim","Meta.SizeChange.FULLSCREEN");
                _windowids_size_change[win.get_id()]="place";
            }
        else if (change === Meta.SizeChange.UNMAXIMIZE)
            {
            //console.log("achim","Meta.SizeChange.UNMAXIMIZE");
            // do nothing if it was only partially maximized
            const rectmax=win.get_work_area_for_monitor(win.get_monitor());     
            if (rectmax.equal(rectold))
                {
                //console.log("achim","rectmax matches");
                _windowids_size_change[win.get_id()]="back";
                }
            }
        else if (change === Meta.SizeChange.UNFULLSCREEN)
            {
            //console.log("achim","change === Meta.SizeChange.UNFULLSCREEN");
            if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
                {
                //console.log("achim","!== Meta.MaximizeFlags.BOTH");
                _windowids_size_change[win.get_id()]="back";
                }
            }
    }

    window_manager_minimize(act)
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_minimize");
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.backto(win);
    }

    window_manager_unminimize(act)
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_umminimize");
        if (win.window_type !== Meta.WindowType.NORMAL)
            return;
        if (win.get_maximized() !== Meta.MaximizeFlags.BOTH)
            return;
        if (win.is_always_on_all_workspaces())
            return;
        this.placeOnWorkspace(win);
    }
    
    window_manager_size_changed(act)
    {
        const win = act.meta_window;
        //console.log("achim","window_manager_size_changed "+win.get_id());
        if (win.get_id() in _windowids_size_change) {
            if (_windowids_size_change[win.get_id()]=="place") {                
                this.placeOnWorkspace(win);
            } else if (_windowids_size_change[win.get_id()]=="back") {                
                this.backto(win);
            }
            delete _windowids_size_change[win.get_id()];
        }
    }

    window_manager_switch_workspace()
    {
        // console.log("achim","window_manager_switch_workspace");
    }

    enable() {
        this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
        // Trigger new window with maximize size and if the window is maximized
        _handles.push(global.window_manager.connect('minimize', (_, act) => {this.window_manager_minimize(act);}));
        _handles.push(global.window_manager.connect('unminimize', (_, act) => {this.window_manager_unminimize(act);}));
        _handles.push(global.window_manager.connect('size-changed', (_, act) => {this.window_manager_size_changed(act);}));
        _handles.push(global.window_manager.connect('switch-workspace', (_) => {this.window_manager_switch_workspace();}));
        _handles.push(global.window_manager.connect('map', (_, act) => {this.window_manager_map(act);}));
        _handles.push(global.window_manager.connect('destroy', (_, act) => {this.window_manager_destroy(act);}));
        _handles.push(global.window_manager.connect('size-change', (_, act, change,rectold) => {this.window_manager_size_change(act,change,rectold);}));
    }

    disable() {
        // remove array and disconect
        _handles.splice(0).forEach(h => global.window_manager.disconnect(h));
        
        this._mutterSettings = null;
    }
}
