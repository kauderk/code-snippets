// prettier-ignore
const keys = ['Workflow','joins','parameters','uid','key','value','display','simulate_roam_research_timestamps','ms_options','fmt_options','yt_playback_speed','timestamps','tm_recovery','tm_seek_to','tm_restore','tm_reset_on_removal','tm_loop_hierarchy','tm_loop_to','tm_loop_options','tm_seek_action','tm_workflow_display','tm_workflow_grab','tm_options','experience','initialize_mode','awaiting_input_type','xp_options','playerSettings','play_style','mute_style','fullscreen_style','url_boundaries','url_volume','ps_options','range','timestamp_display_scroll_offset','tdso_opt','end_loop_sound_volume','elsv_opt','iframe_buffer_slider','ibs_opt','defaultPlayerValues','player_span','ps_opt','pv_opt_2','player_volume','vv_opt','pv_opt','player_interface_language','pil_opt','pli_guide','player_captions_language','pcl_opt','pcl_guide','player_captions_on_load','pcol_guide','defaultValues','override_roam_video_component','orvc_opt','end_loop_sound_src','elss_opt','override_simulate_url_to_video_component','orsuvc_opt','YT_API_KEY_V3','yakv_opt','InAndOutKeys','iaok_opt','dropdownMenu','ddm_css_theme_input','ct_opt','LogStatus','DisplacedBlocks','UnknownBlocks','ls_','roam/js/kauderk/yt-gif/settings',]
const map = new Map()
keys.forEach(k => map.set(k, {}))
window.YT_GIF_DIRECT_SETTINGS = map

window.kauderk = {}
window.AvoidCircularDependency = {}
Element.prototype.queryAllasArr = Document.prototype.queryAllasArr = function (
	selector
) {
	return [...document.querySelectorAll(selector)]
}
