<style>

    /*게시판 커스텀 공통*/
        .quickAgree a {
        font-size: 1.2rem;
    }

    .quick_ri_2 input {
        font-size: 1.2rem;
    }
    .quick_submit {
        font-size: 1.4rem;
    }

    header {
        font-size: calc(1rem + ((1vw - 0.48rem) * 1.3889));
    }

    body {
        font-size: 1em;
    }

    .cmt_btn {
        font-family: "pretendard";
    }

    .board_title {
        display: none;
    }

    .margin-default {
        margin: 50px 0 100px;
    }

    .margin-default>p {
        display: none;
    }

    .sv_member {
        display: none;
    }

    .gall_info {
        display: none;
    }

    #bo_sch {
        display: none;
    }

    .gall_text_href {
        padding-top: 5%;
    }

    #gall_ul li {
        border: 1px solid #2c5e39;
        box-shadow: 0px 2px 10px 0px #1111112e;
    }

    /*게시판 커스텀 끝*/
    .k_new_btn_con{
        margin-top: 5%;
        margin-bottom: 5%;
    }
    .k_btn_inner {
        font-size: 1vw;
        background: black;
        color: white;
        padding: 1% 3%;
        border-radius: 30px;
        width: 5vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .k_btn_inner > input {
        outline: none;
        appearance: none;
        border: unset;
        background: unset;
        color: white;
        font-size: 1vw;
    }
    .k_new_btn >.k_btn_inner:nth-child(2) {
        background: #0000008f;
        margin-left: 2%;
        padding: 1% 3% !important;
    }
    .k_input_sort{
        width: 18vw;
        height: 2.6vw;
        box-sizing: border-box;        
    }
    #k_w_bo{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
.td_sort {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 0;
    font-family: 'Pretendard-regular';
    background: #eee;
    height: 2.6vw;
    color: #505050ba;
    width: 11vw;
}
    .tr_sort{
        
    }
    .k_w_bo_1st{
        margin-top: 6%;
    }
    @media screen and (max-width: 599px){
        .k_input_sort{
            width: 38vw;
        } 
        .k_btn_inner {
            font-size: 5vw;
            background: black;
            color: white;
            padding: 1% 3%;
            border-radius: 30px;
            width: 23vw;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .k_btn_inner > input {
            outline: none;
            appearance: none;
            border: unset;
            background: unset;
            color: white;
            font-size: 5vw;
        }        
        .td_sort {
            display: flex;
            font-family: 'Pretendard-regular';
            width: 27vw;
            height: 9.6vw;
        }
        .k_input_sort {
            width: 63vw;
            height: 9.6vw;

        }        
    }
</style>

<div class="boxy-warp sub-contents">
	<div class="r-sub-con">

		<?php
		if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

		// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
		add_stylesheet('<link rel="stylesheet" href="'.$board_skin_url.'/style.css">', 0);
		?>

		<section id="bo_w">
				<!-- <h2 class="sound_only"><?php echo $g5['title'] ?></h2> -->

				<!-- 게시물 작성/수정 시작 { -->
				<form name="fwrite" id="fwrite" action="<?php echo $action_url ?>" onsubmit="return fwrite_submit(this);" method="post" enctype="multipart/form-data" autocomplete="off" style="width:<?php echo $width; ?>">
				<input type="hidden" name="uid" value="<?php echo get_uniqid(); ?>">
				<input type="hidden" name="w" value="<?php echo $w ?>">
				<input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
				<input type="hidden" name="wr_id" value="<?php echo $wr_id ?>">
				<input type="hidden" name="sca" value="<?php echo $sca ?>">
				<input type="hidden" name="sfl" value="<?php echo $sfl ?>">
				<input type="hidden" name="stx" value="<?php echo $stx ?>">
				<input type="hidden" name="spt" value="<?php echo $spt ?>">
				<input type="hidden" name="sst" value="<?php echo $sst ?>">
				<input type="hidden" name="sod" value="<?php echo $sod ?>">
				<input type="hidden" name="page" value="<?php echo $page ?>">

				<?php
				$option = '';
				$option_hidden = '';
				if ($is_notice || $is_html || $is_secret || $is_mail) {
						$option = '';
						if ($is_notice) {
								$option .= "\n".'<input type="checkbox" id="notice" name="notice" value="1" '.$notice_checked.'>'."\n".'<label for="notice">공지</label>';
						}

						if ($is_html) {
								if ($is_dhtml_editor) {
										$option_hidden .= '<input type="hidden" value="html1" name="html">';
								} else {
										$option .= "\n".'<input type="checkbox" id="html" name="html" onclick="html_auto_br(this);" value="'.$html_value.'" '.$html_checked.'>'."\n".'<label for="html">HTML</label>';
								}
						}

						if ($is_secret) {
								if ($is_admin || $is_secret==1) {
										$option .= "\n".'<input type="checkbox" id="secret" name="secret" value="secret" '.$secret_checked.'>'."\n".'<label for="secret">비밀글</label>';
								} else {
										$option_hidden .= '<input type="hidden" name="secret" value="secret">';
								}
						}

						if ($is_mail) {
								$option .= "\n".'<input type="checkbox" id="mail" name="mail" value="mail" '.$recv_email_checked.'>'."\n".'<label for="mail">답변메일받기</label>';
						}
				}

				echo $option_hidden;
				?>

				<div class="">
				<?php if ($is_name) { ?>
						<label for="wr_name" class="sound_only">이름<strong>필수</strong></label>
						<input type="text" name="wr_name" value="<?php echo $name ?>" id="wr_name" required class="frm_input required" placeholder="이름" style="margin-left: -3px;">
				<?php } ?>

				<?php if ($is_password) { ?>
						<label for="wr_password" class="sound_only">비밀번호<strong>필수</strong></label>
						<input type="password" name="wr_password" id="wr_password" <?php echo $password_required ?> class="frm_input <?php echo $password_required ?>" placeholder="비밀번호">
				<?php } ?>

				<?php if ($is_email) { ?>
								<label for="wr_email" class="sound_only">이메일</label>
								<input type="text" name="wr_email" value="<?php echo $email ?>" id="wr_email" class="frm_input email " placeholder="이메일">
				<?php } ?>
				</div>

				<?php if ($is_homepage) { ?>
				<div class="write_div">
						<label for="wr_homepage" class="sound_only">전화번호</label>
						<input type="text" name="wr_homepage" value="<?php echo $homepage ?>" id="wr_homepage" class="frm_input full_input" size="50" placeholder="전화번호" style="width: 100%;padding: 5px;">
				</div>
				<?php } ?>

<div id="k_w_bo" class="k_w_bo_1st">
					<table class="k_w_table">
						<!---<?php if ($option) { ?>
						<tr class="option-box">
							<td width=200>공지 <span class="sound_only">공지</span></td>
							<td>
								<?php echo $option ?>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 출력순서와 상관없이 맨위로 고정시킵니다.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 전체 탭에서만 적용됩니다.</span>
							</td>
						</tr>
						<?php } ?>--->

						<!---<tr class="option-box">
							<td width=200>메인출력</td>
							<td>
								<input type="checkbox" name="wr_2" value="1" id="wr_2" <?php echo get_checked($write['wr_2'], '1'); ?>> 체크하시면 메인페이지에 출력됩니다.
							</td>
						</tr>--->

						<tr class="option-box tr_sort">
							<td class='td_sort' width=200>출력순서</td>
							<td>
								<input type="text" name="wr_1" value="<?php echo $wr_1 ?>" id="wr_1" class="frm_input k_input k_input_sort" maxlength="3" placeholder="ex) 1 ~ 999" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');">
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 999 ~ 1 사이의 숫자를 입력해주세요.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 숫자가 높을수록 먼저 출력됩니다.</span>
								<span style="display: block;font-size: .9rem;margin-top: 5px;">※ 숫자가 같을 경우 최신순으로 출력됩니다.</span>
							</td>
						</tr>
					</table>
				</div>
        
				<div id="k_w_bo" style="margin-top: 50px;">
					<table class="k_w_table">
						<tr class="option-box tr_sort">
							<td class='td_sort' width=200>분류<b>*</b><span class="sound_only">필수</span></td>
							<td >
								<select name="ca_name" id="ca_name" class="frm_input k_input k_input_sort" style="font-size: 1rem;">
									<option value="">분류를 선택하세요</option>
									<?php echo $category_option ?>
								</select>
							</td>
						</tr>
<!--
						<tr class="tr_sort">
							<td class='td_sort'>메뉴설명<b>*</b><span class="sound_only"> 메뉴설명 </span></td>
							<td ><input type="text" name="wr_2" value="<?php echo $wr_2 ?>" id="wr_2" required class="k_input_sort frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="전화번호를 입력해주세요."></td>
						</tr>
-->
						<tr class="tr_sort">
							<td class='td_sort'>제목<b>*</b><span class="sound_only"> 제목 </span></td>
							<td><input type="text" name="wr_subject" value="<?php echo $subject ?>" id="wr_subject" required class="k_input_sort frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="제목을 입력해주세요."></td>
						</tr>
      
								


						<?php for ($i=0; $is_file && $i<0; $i++) { ?>
						<tr class="tr_sort">
							<?php if($i == "0"){ ?>
								<td class='td_sort'>내용사진 #<?php echo $i+1 ?></td>
							<? }else{ ?>
								<td class='td_sort'>내용사진 #<?php echo $i+1 ?></td>
							<? } ?>

							<td style='position:relative'>
								<input type="file" name="bf_file[]" title="파일첨부 <?php echo $i+1 ?> :  용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능" class="frm_file frm_input k_input_sort" class="k_input_sort frm_input full_input required k_input k_input_w100">
								<?php if ($is_file_content) { ?>
								<input type="text" name="bf_content[]" value="<?php echo ($w == 'u') ? $file[$i]['bf_content'] : ''; ?>" title="파일 설명을 입력해주세요." class="frm_file frm_input" >
								<?php } ?>
								<?php if($w == 'u' && $file[$i]['file']) { ?>
								<input style='position:absolute;bottom: 3%;' type="checkbox" id="bf_file_del<?php echo $i ?>" name="bf_file_del[<?php echo $i; ?>]" value="1" > <label  style='position:absolute;bottom: 3%;left: 108%;' for="bf_file_del<?php echo $i ?>"><?php echo $file[$i]['source'].'('.$file[$i]['size'].')'; ?> 파일 삭제</label>
								<?php } ?>
							</td>
						</tr>
						<?php } ?>
					</table>
				</div>

				<div id="" style="margin-top: 50px;">
					<table class="k_w_table">


						<?php if($bo_table=='main_youtube'){ ?>
                       
                            <tr>
                                <span style="display: block;font-size: .9rem;margin-top: 5px;">※ 유튜브 링크의 v 값을 입력해주세요</span>
                                <span style="display: block;font-size: .9rem;margin-top: 5px;">※ www.youtube.com/watch?v=<span style='color:red; font-weight:700'>DghGOak1jII</span></span>
                            </tr>
                                <tr>
                                    <td>유튜브링크<b>*</b><span class="sound_only">링크</span></td>
                                    <td><input type="text" name="wr_content" value="<?php echo $content ?>" id="wr_content" required class="frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="v 값을 입력해주세요.예)DghGOak1jII"></td>
                                </tr>
                     
							<? }else{ ?>
<!--
                                    <td>링크<b>*</b><span class="sound_only">링크</span></td>
                                    <td><input type="text" name="wr_content" value="<?php echo $content ?>" id="wr_content" required class="frm_input full_input required k_input k_input_w100" size="50" maxlength="255" placeholder="이동될 링크를 입력해주세요."></td>
-->

                        <tr>                    
                            <div class="write_div">
                                <label for="wr_content" class="sound_only">내용<strong>필수</strong></label>
                                <div class="wr_content <?php echo $is_dhtml_editor ? $config['cf_editor'] : ''; ?>">
                                    <?php if($write_min || $write_max) { ?>
                                    <!-- 최소/최대 글자 수 사용 시 -->
                                    <p id="char_count_desc">이 게시판은 최소 <strong><?php echo $write_min; ?></strong>글자 이상, 최대 <strong><?php echo $write_max; ?></strong>글자 이하까지 글을 쓰실 수 있습니다.</p>
                                    <?php } ?>
                                    <?php echo $editor_html; // 에디터 사용시는 에디터로, 아니면 textarea 로 노출 ?>
                                    <?php if($write_min || $write_max) { ?>
                                    <!-- 최소/최대 글자 수 사용 시 -->
                                    <div id="char_count_wrap"><span id="char_count"></span>글자</div>
                                    <?php } ?>
                                </div>

                            </div>
                        </tr>
                                
<!--
                        						<tr>
							<?php if($i == "0"){ ?>
								<td>썸네일 #<?php echo $i+1 ?></td>
							<? }else{ ?>
								<td>내용사진 #<?php echo $i+1 ?></td>
							<? } ?>

							<td>
								<input type="file" name="bf_file[]" title="파일첨부 <?php echo $i+1 ?> :  용량 <?php echo $upload_max_filesize ?> 이하만 업로드 가능" class="frm_file frm_input">
								<?php if ($is_file_content) { ?>
								<input type="text" name="bf_content[]" value="<?php echo ($w == 'u') ? $file[$i]['bf_content'] : ''; ?>" title="파일 설명을 입력해주세요." class="frm_file frm_input">
								<?php } ?>
								<?php if($w == 'u' && $file[$i]['file']) { ?>
								<input type="checkbox" id="bf_file_del<?php echo $i ?>" name="bf_file_del[<?php echo $i; ?>]" value="1"> <label for="bf_file_del<?php echo $i ?>"><?php echo $file[$i]['source'].'('.$file[$i]['size'].')'; ?> 파일 삭제</label>
								<?php } ?>
							</td>
						</tr>
-->
                        
							<? } ?>
                        


						<?php for ($i=0; $is_file && $i<2; $i++) { ?>

						<?php } ?>
					</table>
				</div>

				<?php if ($is_use_captcha) { //자동등록방지  ?>
				<div class="write_div">
						<?php echo $captcha_html ?>
				</div>
				<?php } ?>

				<!-- 게시물 상단 버튼 시작 { -->
				<?php if ($list_href || $is_checkbox || $write_href) { ?>
				<div class="bo_fx">
					<?php if ($list_href || $write_href) { ?>

					<div class="k_new_btn">
						<?php if ($is_checkbox) { ?>
							<div><button type="submit" name="btn_submit" value="선택삭제" onclick="document.pressed=this.value" class="k_btn_00">선택삭제</button></div>
							<div><button type="submit" name="btn_submit" value="선택복사" onclick="document.pressed=this.value" class="k_btn_00">선택복사</button></div>
							<div><button type="submit" name="btn_submit" value="선택이동" onclick="document.pressed=this.value" class="k_btn_00">선택이동</button></div>
						<?php } ?>
						<?php if ($write_href) { ?><div><a href="<?php echo $write_href ?>" class="k_btn_00 k_btn_01">글쓰기</a></div><?php } ?>
					</div>
					<?php } ?>
				</div>
				<?php } ?>
				<!-- 게시물 상단 버튼 시작 { -->


				<div class="">
					<div class="k_new_btn">
						<div class="k_btn_inner"><a href="./board.php?bo_table=<?php echo $bo_table ?>" class="k_btn_00">취소</a></div>
						<div class="k_btn_inner"><input type="submit" value="작성완료" id="btn_submit" accesskey="s" class="k_btn_00 k_btn_01"></div>
					</div>
				</div>
				</form>

				<script>
				<?php if($write_min || $write_max) { ?>
				// 글자수 제한
				var char_min = parseInt(<?php echo $write_min; ?>); // 최소
				var char_max = parseInt(<?php echo $write_max; ?>); // 최대
				check_byte("wr_content", "char_count");

				$(function() {
						$("#wr_content").on("keyup", function() {
								check_byte("wr_content", "char_count");
						});
				});

				<?php } ?>
				function html_auto_br(obj)
				{
						if (obj.checked) {
								result = confirm("자동 줄바꿈을 하시겠습니까?\n\n자동 줄바꿈은 게시물 내용중 줄바뀐 곳을<br>태그로 변환하는 기능입니다.");
								if (result)
										obj.value = "html2";
								else
										obj.value = "html1";
						}
						else
								obj.value = "";
				}

				function fwrite_submit(f)
				{
						<?php echo $editor_js; // 에디터 사용시 자바스크립트에서 내용을 폼필드로 넣어주며 내용이 입력되었는지 검사함   ?>

						var subject = "";
						var content = "";
						$.ajax({
								url: g5_bbs_url+"/ajax.filter.php",
								type: "POST",
								data: {
										"subject": f.wr_subject.value,
										"content": f.wr_content.value
								},
								dataType: "json",
								async: false,
								cache: false,
								success: function(data, textStatus) {
										subject = data.subject;
										content = data.content;
								}
						});

						if (subject) {
								alert("제목에 금지단어('"+subject+"')가 포함되어있습니다");
								f.wr_subject.focus();
								return false;
						}

						if (content) {
								alert("내용에 금지단어('"+content+"')가 포함되어있습니다");
								if (typeof(ed_wr_content) != "undefined")
										ed_wr_content.returnFalse();
								else
										f.wr_content.focus();
								return false;
						}

						if (document.getElementById("char_count")) {
								if (char_min > 0 || char_max > 0) {
										var cnt = parseInt(check_byte("wr_content", "char_count"));
										if (char_min > 0 && char_min > cnt) {
												alert("내용은 "+char_min+"글자 이상 쓰셔야 합니다.");
												return false;
										}
										else if (char_max > 0 && char_max < cnt) {
												alert("내용은 "+char_max+"글자 이하로 쓰셔야 합니다.");
												return false;
										}
								}
						}

						<?php echo $captcha_js; // 캡챠 사용시 자바스크립트에서 입력된 캡챠를 검사함  ?>

						document.getElementById("btn_submit").disabled = "disabled";

						return true;
				}
				</script>
		</section>
		<!-- } 게시물 작성/수정 끝 -->
	</div>
</div>