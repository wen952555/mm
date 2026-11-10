<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <!-- Modal Box: Auto-adapts to mobile height with permanently visible action footer -->
      <div
        class="w-full max-w-[450px] max-h-[96vh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#EFE5D3] border border-[#D8C7B0] shadow-2xl overflow-hidden relative text-[#3C2C1E]"
      >
        <!-- 1. Top Header Bar (Fixed / Shrink-0) -->
        <div class="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-[#D8C7B0] shrink-0 gap-2 bg-[#FAF4E8]">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xl sm:text-2xl shrink-0">🏮</span>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-[#3C2C1E] font-serif-title truncate">
                {{ isLoggedIn ? '用户账号管理' : (authTab === 'login' ? '牌友登录' : '新秀注册') }}
              </h3>
              <p class="text-[10px] sm:text-[11px] text-[#6B5744] truncate">
                {{ isLoggedIn ? '管理对局身份与云端战绩' : (authTab === 'login' ? '输入手机号与密码快速登录' : '授权手机号注册即送 8,888 开局筹码') }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="$emit('close')"
            class="w-7 h-7 rounded-full bg-[#EFE5D3] hover:bg-[#E5D7C2] border border-[#D8C7B0] flex items-center justify-center text-xs text-[#3C2C1E] transition-colors cursor-pointer shrink-0"
            title="关闭"
          >
            ✕
          </button>
        </div>

        <!-- 2. Segmented Tab Switcher (When Not Logged In, Fixed) -->
        <div v-if="!isLoggedIn" class="px-3.5 pt-2.5 pb-1 sm:px-5 shrink-0 bg-[#FAF4E8]">
          <div class="flex items-center gap-1 p-1 bg-[#EFE5D3] rounded-xl border border-[#D8C7B0]">
            <button
              type="button"
              @click="authTab = 'login'; errorMessage = ''"
              :class="authTab === 'login' ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold shadow-md' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
              class="flex-1 py-1.5 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <span>🔑</span>
              <span>账号登录</span>
            </button>
            <button
              type="button"
              @click="authTab = 'register'; errorMessage = ''"
              :class="authTab === 'register' ? 'bg-gradient-to-r from-[#5C4533] to-[#433022] text-[#FAF4E8] font-bold shadow-md' : 'text-[#6B5744] hover:text-[#3C2C1E]'"
              class="flex-1 py-1.5 text-xs rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <span>✨</span>
              <span>快速注册</span>
            </button>
          </div>
        </div>

        <!-- 3. Scrollable Input Body (Middle Area) -->
        <div class="flex-1 overflow-y-auto px-3.5 py-2 sm:px-5 min-h-0 space-y-2.5 overscroll-contain">
          <!-- A. Logged In Profile Card Mode -->
          <div v-if="isLoggedIn" class="py-1 space-y-3">
            <div class="p-3 rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-2xl p-1.5 rounded-xl bg-[#EFE5D3] border border-[#D8C7B0] shrink-0">
                  {{ currentProfile.avatar }}
                </span>
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-bold text-[#3C2C1E] flex items-center gap-1.5 truncate">
                    <span class="truncate">{{ currentProfile.name }}</span>
                    <span class="text-[9px] px-1.5 py-0.2 rounded bg-[#EFE5D3] text-[#3C2C1E] border border-[#D8C7B0] shrink-0 font-mono">
                      LV.{{ currentProfile.level }}
                    </span>
                  </div>
                  <div class="text-[10px] text-[#6B5744] font-mono mt-0.5 truncate">
                    手机账号: {{ currentProfile.phone || currentProfile.username }} · UID: {{ currentProfile.id }}
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs text-[#5C4533] font-mono font-bold">🪙 {{ currentProfile.coins.toLocaleString() }} 分</div>
                <div class="text-[10px] text-[#6B5744] mt-0.5">积分: {{ currentProfile.rating }}</div>
              </div>
            </div>

            <!-- Edit Nickname -->
            <div>
              <label class="block text-[11px] text-[#6B5744] mb-1">修改堂号名讳 (最多3个字)</label>
              <input
                v-model="editName"
                type="text"
                maxlength="3"
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] shadow-inner"
                placeholder="请输入新的名号 (最多3个字)..."
              />
            </div>

            <!-- Edit Avatar -->
            <div>
              <label class="block text-[11px] text-[#6B5744] mb-1">更换牌桌头像印信</label>
              <div class="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                <button
                  v-for="av in AVATAR_OPTIONS"
                  :key="av"
                  type="button"
                  @click="editAvatar = av"
                  :class="editAvatar === av ? 'border-[#5C4533] bg-[#EFE5D3] text-[#3C2C1E] ring-2 ring-[#7D6049] scale-105' : 'border-[#D8C7B0] bg-[#FFFDF8] text-[#3C2C1E]/80 hover:border-[#BFA98F]'"
                  class="w-8 h-8 rounded-lg border text-base flex items-center justify-center shrink-0 transition-all cursor-pointer"
                >
                  {{ av }}
                </button>
              </div>
            </div>
          </div>

          <!-- B. Not Logged In: Form Inputs -->
          <div v-else class="py-1 space-y-2.5">
            <!-- 1) Login Form (Compact: 仅支持手机号与密码登录) -->
            <div v-if="authTab === 'login'" class="space-y-2.5">
              <div>
                <label class="block text-[11px] text-[#6B5744] mb-1">登录手机号</label>
                <input
                  v-model="formPhone"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  required
                  class="w-full px-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] font-mono shadow-inner"
                  placeholder="请输入您的登录手机号 (如 13012345678)"
                  @keydown.enter="submitLogin"
                />
              </div>

              <div>
                <label class="block text-[11px] text-[#6B5744] mb-1">登录密码</label>
                <input
                  v-model="formPassword"
                  type="password"
                  required
                  autocomplete="current-password"
                  class="w-full px-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] shadow-inner font-mono"
                  placeholder="请输入登录密码..."
                  @keydown.enter="submitLogin"
                />
              </div>
            </div>

            <!-- 2) Register Form (Compact 2-Column Grid: 移除账号名，以手机号为唯一凭证) -->
            <div v-else-if="authTab === 'register'" class="space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <!-- Phone (Whitelist) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] text-[#6B5744]">授权手机号</label>
                    <span class="text-[9px] px-1 py-0.2 rounded bg-[#FAF4E8] text-[#5C4533] font-mono border border-[#D8C7B0]">Bot白名单</span>
                  </div>
                  <input
                    v-model="formPhone"
                    type="tel"
                    inputmode="tel"
                    autocomplete="tel"
                    required
                    class="w-full px-3 py-1.5 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] font-mono shadow-inner"
                    placeholder="输入已获Bot授权的手机号"
                    @keydown.enter="submitRegister"
                  />
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-[11px] text-[#6B5744] mb-1">设置登录密码 (六位数字)</label>
                  <input
                    v-model="formPassword"
                    type="password"
                    inputmode="numeric"
                    maxlength="6"
                    required
                    class="w-full px-3 py-1.5 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] shadow-inner font-mono"
                    placeholder="设置6位数字密码"
                    @keydown.enter="submitRegister"
                  />
                </div>

                <!-- Nickname -->
                <div class="sm:col-span-2">
                  <label class="block text-[11px] text-[#6B5744] mb-1">牌桌名号 (昵称，最多3个字)</label>
                  <input
                    v-model="formNickname"
                    type="text"
                    maxlength="3"
                    class="w-full px-3 py-1.5 text-xs rounded-xl bg-[#FFFDF8] border border-[#D8C7B0] text-[#3C2C1E] focus:outline-none focus:border-[#5C4533] shadow-inner"
                    placeholder="如：茶客（选填，最多3个字）"
                    @keydown.enter="submitRegister"
                  />
                </div>
              </div>
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="p-2 rounded-xl bg-red-100 border border-red-300 text-[11px] text-red-800 leading-snug flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{{ errorMessage }}</span>
            </div>
          </div>
        </div>

        <!-- 4. DOCKED STICKY FOOTER (吸底常驻操作栏，绝不被软键盘或滚动条掩盖！) -->
        <div class="shrink-0 p-3 sm:px-5 bg-[#FAF4E8] border-t border-[#D8C7B0] flex flex-col gap-1.5 shadow-2xl">
          <!-- When Logged In: Save / Logout Buttons -->
          <div v-if="isLoggedIn" class="flex items-center justify-between gap-2.5">
            <button
              type="button"
              @click="handleLogout"
              class="flex-1 py-2 text-xs font-medium rounded-xl bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 transition-colors cursor-pointer text-center"
            >
              退出登录
            </button>
            <button
              type="button"
              @click="handleSaveProfile"
              class="flex-1 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] shadow-md transition-colors cursor-pointer text-center"
            >
              保存修改
            </button>
          </div>

          <!-- When Auth (Login / Register): Primary Action Button -->
          <template v-else>
            <button
              type="button"
              @click="authTab === 'login' ? submitLogin() : submitRegister()"
              class="w-full py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#5C4533] to-[#433022] hover:from-[#4E3929] hover:to-[#38271A] text-[#FAF4E8] border border-[#7D6049] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{{ authTab === 'login' ? '🔑 立即登录账号' : '✨ 立即注册账号' }}</span>
            </button>

            <!-- Bottom Subtitle / Guidance -->
            <div class="text-[10px] text-center text-[#6B5744] flex items-center justify-center gap-1">
              <span>🛡️</span>
              <span v-if="authTab === 'login'">单设备安全会话机制 · 保护您的账号资产</span>
              <span v-else>注册手机号须由管理员在 Telegram Bot 中发送 /authphone 授权</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  UserProfile,
  AccountData,
  getRegisteredAccounts,
  saveRegisteredAccounts,
  saveLocalProfile,
  recordPointsTx,
  hashPassword,
} from '../utils/storage';
import { soundFX } from '../utils/sound';
import { resolveApiUrl } from '../utils/networkConfig';

const props = defineProps<{
  profile: UserProfile;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:profile', p: UserProfile): void;
  (e: 'open-termux'): void;
}>();

const authTab = ref<'login' | 'register'>('login');
const isLoggedIn = ref(props.profile.isLoggedIn);
const currentProfile = reactive<UserProfile>({ ...props.profile });
if (!currentProfile.avatar || currentProfile.avatar === '🀄') {
  currentProfile.avatar = '👑';
}

const editName = ref(currentProfile.name);
const editAvatar = ref(currentProfile.avatar);

const formPassword = ref('');
const formPhone = ref('');
const formNickname = ref('');
const formAvatar = ref('👑');
const errorMessage = ref('');
const AVATAR_OPTIONS = ['👑', '🍵', '♟️', '🃏', '🐉', '⚡', '🪓', '🐯', '🦅', '🪙', '🏮', '🎋'];

async function submitLogin() {
  errorMessage.value = '';
  const phone = formPhone.value.trim().replace(/\D/g, '');
  if (!phone || !formPassword.value) {
    errorMessage.value = '请输入登录手机号和密码';
    return;
  }
  const accounts = getRegisteredAccounts();

  try {
    const res = await fetch(resolveApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        password: formPassword.value,
      }),
    });
    const data = await res.json();
    if (data.success && data.profile) {
      const serverProfile: UserProfile = {
        ...data.profile,
        isLoggedIn: true,
        sessionToken: data.sessionToken,
      };
      const hashedPassword = await hashPassword(formPassword.value);
      const exIdx = accounts.findIndex(
        (a) => (a.phone && a.phone.replace(/\D/g, '') === phone) ||
               (a.username && a.username.toLowerCase() === phone.toLowerCase())
      );
      const accountEntry: AccountData = {
        username: serverProfile.username || phone,
        phone,
        password: hashedPassword,
        profile: serverProfile,
        updatedAt: Date.now(),
      };
      if (exIdx >= 0) {
        accounts[exIdx] = accountEntry;
      } else {
        accounts.push(accountEntry);
      }
      saveRegisteredAccounts(accounts);
      saveLocalProfile(serverProfile);
      Object.assign(currentProfile, serverProfile);
      isLoggedIn.value = true;
      emit('update:profile', serverProfile);
      soundFX.playVictory();
      emit('close');
      return;
    } else {
      if (data.needRegister) {
        authTab.value = 'register';
        errorMessage.value = data.error || '该手机号已在白名单授权，尚未激活注册。请在此设置6位密码与牌桌昵称！';
        soundFX.playTap();
        return;
      }
      errorMessage.value = data.error || '手机号或密码不匹配，请核对后再试';
      soundFX.playTap();
      return;
    }
  } catch (err: any) {
    const targetServer = resolveApiUrl('/api/auth/login').replace(/\/api\/.*/, '');
    errorMessage.value = `连接服务器异常 (${err?.message || '网络请求失败'})，请检查网络或在右上角【📡 服务器配置】中核对地址: ${targetServer}`;
  }
}

async function submitRegister() {
  errorMessage.value = '';
  const phone = formPhone.value.trim().replace(/\D/g, '');
  if (!phone || !formPassword.value) {
    errorMessage.value = '请填写授权手机号和6位登录密码';
    return;
  }
  if (formPassword.value.length !== 6) {
    errorMessage.value = '登录密码必须为六位数';
    return;
  }
  if (formNickname.value.trim().length > 3) {
    errorMessage.value = '昵称长度不能超过3个字';
    return;
  }

  try {
    const res = await fetch(resolveApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        password: formPassword.value,
        nickname: formNickname.value.trim(),
        avatar: formAvatar.value,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      errorMessage.value = data.error || '该手机号无效或未获授权';
      return;
    }
    const newProfile = {
      ...data.profile,
      isLoggedIn: true,
      sessionToken: data.sessionToken,
    };
    saveLocalProfile(newProfile);

    if (newProfile.coins > 0) {
      recordPointsTx('checkin', '新茶客开局好运礼金', newProfile.coins, newProfile.coins, phone || newProfile.id);
    }

    // Save to local registered accounts store for offline/persistent login
    const hashedPassword = await hashPassword(formPassword.value);
    const accounts = getRegisteredAccounts();
    const existingIdx = accounts.findIndex(
      (a) => (a.phone && a.phone.replace(/\D/g, '') === phone) ||
             (a.username && a.username.toLowerCase() === phone.toLowerCase())
    );
    const accountEntry: AccountData = {
      username: newProfile.username || phone,
      phone,
      password: hashedPassword,
      profile: { ...newProfile, isLoggedIn: true },
      updatedAt: Date.now(),
    };
    if (existingIdx >= 0) {
      accounts[existingIdx] = accountEntry;
    } else {
      accounts.push(accountEntry);
    }
    saveRegisteredAccounts(accounts);

    Object.assign(currentProfile, newProfile);
    isLoggedIn.value = true;
    emit('update:profile', newProfile);
    soundFX.playVictory();
    emit('close');
  } catch (err: any) {
    const targetServer = resolveApiUrl('/api/auth/register').replace(/\/api\/.*/, '');
    errorMessage.value = `注册请求异常 (${err?.message || '网络请求失败'})，请在【📡 服务器配置】中核对服务器地址: ${targetServer}`;
  }
}

function handleSaveProfile() {
  const newName = editName.value.trim();
  if (newName.length > 3) {
    errorMessage.value = '昵称长度不能超过3个字';
    return;
  }
  currentProfile.name = newName || currentProfile.name;
  currentProfile.avatar = editAvatar.value;
  saveLocalProfile(currentProfile);

  const accounts = getRegisteredAccounts();
  const acc = accounts.find(
    (a) => (a.phone && a.phone === currentProfile.phone) ||
           (a.username.toLowerCase() === currentProfile.username.toLowerCase())
  );
  if (acc) {
    acc.profile = { ...currentProfile };
    acc.updatedAt = Date.now();
    saveRegisteredAccounts(accounts);
  }

  emit('update:profile', { ...currentProfile });
  soundFX.playTap();
  emit('close');
}

function handleLogout() {
  currentProfile.isLoggedIn = false;
  currentProfile.sessionToken = '';
  isLoggedIn.value = false;
  saveLocalProfile(currentProfile);
  emit('update:profile', { ...currentProfile });
  soundFX.playTap();
  authTab.value = 'login';
}

onMounted(() => {
  if (props.profile.phone && !formPhone.value) {
    formPhone.value = props.profile.phone;
  }
});
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
