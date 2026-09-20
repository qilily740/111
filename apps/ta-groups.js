(() => {
  const storageKey = 'ideal-machine-ta-groups';
  const maxGroups = 5;

  function readAll() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function writeAll(value) {
    localStorage.setItem(storageKey, JSON.stringify(value || {}));
  }

  function uid(prefix = 'ta-group') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function groupMessageNoise(text) {
    return /系统提示|对方账号已注销|消息无法送达|请先(?:绑定|配置|设置)|刷新(?:角色|聊天)?失败|回复失败|无法连接接口|Failed to fetch|NetworkError|提示词|HTTP\s*\d{3}/i.test(String(text || ''));
  }

  function normalizeMessage(message = {}) {
    return {
      ...message,
      id: message.id || uid('ta-group-message'),
      senderId: String(message.senderId || message.authorId || ''),
      senderName: String(message.senderName || message.author || '群成员'),
      senderAvatar: String(message.senderAvatar || message.avatar || ''),
      senderKind: String(message.senderKind || (message.role === 'user' ? 'user' : 'npc')),
      role: message.role === 'user' || message.senderKind === 'user' ? 'user' : 'character',
      type: String(message.type || ''),
      sticker: Boolean(message.sticker || message.type === 'sticker'),
      stickerDescription: String(message.stickerDescription || '').trim(),
      text: String(message.text || message.media || message.content || '').trim(),
      time: String(message.time || '').trim(),
      createdAt: Number(message.createdAt || Date.now())
    };
  }

  function normalizeMember(member = {}) {
    return {
      id: String(member.id || uid('ta-group-member')),
      name: String(member.name || member.nickname || '群成员'),
      avatar: String(member.avatar || ''),
      kind: String(member.kind || 'npc'),
      identity: String(member.identity || '群成员'),
      persona: String(member.persona || member.personality || '')
    };
  }

  function normalizeGroup(group = {}, roleId = '') {
    const members = Array.isArray(group.members) ? group.members.map(normalizeMember) : [];
    const memberIds = Array.isArray(group.memberIds) && group.memberIds.length
      ? group.memberIds.map(String)
      : members.map(member => member.id);
    return {
      id: String(group.id || uid('ta-group')),
      roleId: String(group.roleId || roleId),
      category: String(group.category || group.type || '').trim(),
      categorySource: String(group.categorySource || '').trim(),
      name: String(group.name || '临时小分队').trim(),
      topic: String(group.topic || group.reason || '').trim(),
      members,
      memberIds:[...new Set(memberIds)],
      userJoined: Boolean(group.userJoined || group.joinedUserId),
      joinedUserId: String(group.joinedUserId || ''),
      profileId: String(group.profileId || ''),
      messages: Array.isArray(group.messages) ? group.messages.map(normalizeMessage).filter(message => message.text) : [],
      createdAt: Number(group.createdAt || Date.now()),
      updatedAt: Number(group.updatedAt || group.createdAt || Date.now())
    };
  }

  function list(roleId) {
    const all = readAll();
    const raw = Array.isArray(all[roleId]) ? all[roleId] : [];
    const normalized = raw.map(group => normalizeGroup(group, roleId));
    const cleaned = normalized.map(group => ({ ...group, messages:group.messages.filter(message => !groupMessageNoise(message.text)) }));
    if (JSON.stringify(raw) !== JSON.stringify(cleaned)) {
      all[roleId] = cleaned;
      writeAll(all);
    }
    return cleaned;
  }

  function save(roleId, groups, options = {}) {
    if (!roleId) return [];
    const all = readAll();
    const normalized = (Array.isArray(groups) ? groups : []).map(group => normalizeGroup(group, roleId));
    all[roleId] = normalized.slice(0, maxGroups);
    writeAll(all);
    if (options.sync !== false) syncRole(roleId);
    if (options.notify !== false) window.dispatchEvent(new CustomEvent('ideal-machine-ta-groups-updated'));
    return all[roleId];
  }

  function upsert(roleId, group, options = {}) {
    const groups = list(roleId);
    const index = groups.findIndex(item => item.id === group.id);
    if (index >= 0) groups[index] = normalizeGroup({ ...groups[index], ...group }, roleId);
    else groups.push(normalizeGroup(group, roleId));
    return save(roleId, groups, options);
  }

  function desktopChatState() {
    try {
      const value = JSON.parse(localStorage.getItem('ideal-machine-chat') || '{}');
      value.contacts = Array.isArray(value.contacts) ? value.contacts : [];
      value.chats = value.chats && typeof value.chats === 'object' ? value.chats : {};
      return value;
    } catch { return { contacts: [], chats: {} }; }
  }

  function desktopMessage(message) {
    return {
      ...message,
      id: message.id,
      text: message.text,
      role: message.role === 'user' ? 'user' : 'character',
      senderId: message.senderId,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      senderKind: message.senderKind,
      taGroupMessage: true,
      type: message.type,
      sticker: message.sticker,
      stickerDescription: message.stickerDescription,
      time: message.time,
      createdAt: message.createdAt
    };
  }

  function syncToDesktop(group) {
    if (!group?.roleId || !group.id) return;
    const state = desktopChatState();
    const contactId = `ta-group:${group.roleId}:${group.id}`;
    if (!group.userJoined) {
      const nextContacts = state.contacts.filter(contact => contact.id !== contactId);
      if (nextContacts.length !== state.contacts.length || state.chats[contactId]) {
        state.contacts = nextContacts;
        delete state.chats[contactId];
        localStorage.setItem('ideal-machine-chat', JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('ideal-machine-chat-updated'));
      }
      return;
    }
    const existingContact = state.contacts.find(contact => contact.id === contactId) || {};
    const profileId = group.profileId || state.chats?.[group.roleId]?.profileId || '';
    const contact = {
      ...existingContact,
      id: contactId,
      name: group.name,
      nickname: group.name,
      identity: `群聊 · ${group.members.length} 人`,
      isGroup: true,
      taGroupId: group.id,
      taRoleId: group.roleId,
      taGroupMembers: group.members,
      taGroupUserJoined: group.userJoined,
      avatar: group.members.find(member => member.kind === 'npc')?.avatar || group.members[0]?.avatar || '',
      groupIds: Array.isArray(existingContact.groupIds) ? existingContact.groupIds : []
    };
    const index = state.contacts.findIndex(item => item.id === contactId);
    if (index >= 0) state.contacts[index] = contact; else state.contacts.unshift(contact);
    state.chats[contactId] = {
      ...(state.chats[contactId] || {}),
      profileId,
      isTaGroup: true,
      taGroupId: group.id,
      taRoleId: group.roleId,
      messages: group.messages.map(desktopMessage)
    };
    localStorage.setItem('ideal-machine-chat', JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('ideal-machine-chat-updated'));
  }

  function syncRole(roleId) {
    const groups = list(roleId);
    const joinedIds = new Set(groups.filter(group => group.userJoined).map(group => group.id));
    const state = desktopChatState();
    let removed = false;
    state.contacts = state.contacts.filter(contact => {
      if (!contact?.isGroup || contact.taRoleId !== roleId || joinedIds.has(contact.taGroupId)) return true;
      removed = true;
      delete state.chats[contact.id];
      return false;
    });
    if (removed) {
      localStorage.setItem('ideal-machine-chat', JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('ideal-machine-chat-updated'));
    }
    groups.filter(group => group.userJoined).forEach(syncToDesktop);
  }

  function appendMessage(roleId, groupId, message, options = {}) {
    const groups = list(roleId);
    const group = groups.find(item => item.id === groupId);
    if (!group) return null;
    const normalized = normalizeMessage(message);
    if (!group.messages.some(item => item.id === normalized.id)) group.messages.push(normalized);
    group.updatedAt = Date.now();
    save(roleId, groups, options);
    return group;
  }

  function replaceMessages(roleId, groupId, messages, options = {}) {
    const groups = list(roleId);
    const group = groups.find(item => item.id === groupId);
    if (!group) return null;
    group.messages = (Array.isArray(messages) ? messages : []).map(normalizeMessage).filter(message => message.text || message.recalled);
    group.updatedAt = Date.now();
    save(roleId, groups, options);
    return group;
  }

  function join(roleId, groupId, profile = {}) {
    const groups = list(roleId);
    const group = groups.find(item => item.id === groupId);
    if (!group) return null;
    const userId = String(profile.id || 'user');
    const user = normalizeMember({ id:userId, name:profile.nickname || profile.realName || profile.name || '我', avatar:profile.avatar, kind:'user', identity:'用户', persona:profile.persona });
    group.members = group.members.filter(member => member.kind !== 'user' && member.id !== userId);
    group.members.push(user);
    group.memberIds = [...new Set([...group.memberIds, userId])];
    group.userJoined = true;
    group.joinedUserId = userId;
    group.profileId = String(profile.id || group.profileId || '');
    group.messages.push(normalizeMessage({ senderId:'system', senderName:'群聊', senderKind:'system', role:'character', text:`${user.name} 加入了群聊`, time:new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' }) }));
    group.updatedAt = Date.now();
    save(roleId, groups);
    return group;
  }

  window.IdealMachineTaGroups = { storageKey, maxGroups, list, save, upsert, appendMessage, replaceMessages, join, syncToDesktop, syncRole, normalizeGroup, normalizeMessage };
  Object.keys(readAll()).forEach(syncRole);
})();
