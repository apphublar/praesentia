"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";
import { AlbumPagePreview } from "@/components/app/admin/album/album-page-preview";
import { AlbumPricingBar, AlbumReviewStats } from "@/components/app/admin/album/album-pricing-bar";
import { fetchPhotoAlbumOrder, purchasePhotoAlbum, savePhotoAlbumDraftRemote } from "@/lib/album/client-api";
import type { PhotoAlbumOrder } from "@/lib/album/order-types";
import { buildAlbumPagesFromPhotos, estimatePagesForPhotoCount } from "@/lib/album/auto-build";
import { createDefaultAlbumDraft, loadPhotoAlbumDraft, savePhotoAlbumDraft } from "@/lib/album/draft-storage";
import { formatAlbumCurrency, albumTotalCents } from "@/lib/album/pricing";
import {
  ALBUM_COVER_COLORS,
  ALBUM_COVER_STYLES,
  ALBUM_LAYOUT_LABELS,
  ALBUM_LAYOUT_SLOTS,
  ALBUM_MAX_PAGES,
  ALBUM_MIN_PAGES,
  type AlbumLayoutId,
  type AlbumWizardStep,
  type PhotoAlbumDraft
} from "@/lib/album/types";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";

const STEPS: { id: AlbumWizardStep; label: string }[] = [
  { id: "select", label: "Escolher fotos" },
  { id: "editor", label: "Montar história" },
  { id: "cover", label: "Capa" },
  { id: "review", label: "Finalizar" }
];

function monthKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function newPageId() {
  return `page-${crypto.randomUUID()}`;
}

export function AdminPhotoAlbumExperience({
  event,
  media,
  initialOrder = null
}: {
  event: Event;
  media: MediaItem[];
  initialOrder?: PhotoAlbumOrder | null;
}) {
  const photos = useMemo(() => media.filter((item) => item.type === "photo"), [media]);
  const mediaById = useMemo(() => new Map(photos.map((item) => [item.id, item])), [photos]);
  const selectedPhotoOptions = useMemo(() => photos.filter((photo) => mediaById.has(photo.id)), [photos, mediaById]);

  const [order, setOrder] = useState<PhotoAlbumOrder | null>(initialOrder);
  const [draft, setDraft] = useState<PhotoAlbumDraft>(() => {
    if (initialOrder?.draft) return initialOrder.draft;
    const local = loadPhotoAlbumDraft(event.id);
    return local ?? createDefaultAlbumDraft(event.title, event.hostName);
  });
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previewMode, setPreviewMode] = useState<"single" | "spread" | "book">("spread");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "loading">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPaid = order?.status === "paid" || order?.status === "in_production" || order?.status === "shipped";
  const isLocked = isPaid;

  const reloadOrder = useCallback(async () => {
    const remote = await fetchPhotoAlbumOrder(event.id);
    if (remote) {
      setOrder(remote);
      setDraft(remote.draft);
    }
  }, [event.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      void reloadOrder();
      window.history.replaceState({}, "", `/dashboard/eventos/${event.id}/album`);
    }
  }, [event.id, reloadOrder]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (initialOrder) return;
    void reloadOrder().catch(() => {
      const local = loadPhotoAlbumDraft(event.id);
      if (local) setDraft(local);
    });
  }, [initialOrder, reloadOrder]);

  useEffect(() => {
    if (isLocked) return;
    savePhotoAlbumDraft(event.id, draft);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveState("saving");
      savePhotoAlbumDraftRemote(event.id, draft)
        .then((saved) => {
          setOrder(saved);
          setSaveState("saved");
        })
        .catch(() => setSaveState("error"));
    }, 900);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, event.id, isLocked]);

  const monthOptions = useMemo(() => {
    const keys = [...new Set(photos.map((photo) => monthKey(photo.createdAt)))].sort();
    return keys;
  }, [photos]);

  const visiblePhotos = useMemo(() => {
    let list = photos;
    if (dateFilter !== "all") list = list.filter((photo) => monthKey(photo.createdAt) === dateFilter);
    if (favoritesOnly) list = list.filter((photo) => draft.favoritePhotoIds.includes(photo.id));
    return list;
  }, [photos, dateFilter, favoritesOnly, draft.favoritePhotoIds]);

  const selectedSet = useMemo(() => new Set(draft.selectedPhotoIds), [draft.selectedPhotoIds]);
  const favoriteSet = useMemo(() => new Set(draft.favoritePhotoIds), [draft.favoritePhotoIds]);
  const pageCount = draft.pages.length > 0 ? draft.pages.length : estimatePagesForPhotoCount(draft.selectedPhotoIds.length);

  function updateDraft(patch: Partial<PhotoAlbumDraft>) {
    if (isLocked) return;
    setDraft((current) => ({ ...current, ...patch }));
  }

  function togglePhoto(id: string) {
    if (isLocked) return;
    setDraft((current) => {
      const selected = new Set(current.selectedPhotoIds);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { ...current, selectedPhotoIds: [...selected] };
    });
  }

  function toggleFavorite(id: string) {
    if (isLocked) return;
    setDraft((current) => {
      const favorites = new Set(current.favoritePhotoIds);
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      return { ...current, favoritePhotoIds: [...favorites] };
    });
  }

  function selectVisible() {
    if (isLocked) return;
    updateDraft({ selectedPhotoIds: [...new Set([...draft.selectedPhotoIds, ...visiblePhotos.map((p) => p.id)])] });
  }

  function clearSelection() {
    if (isLocked) return;
    updateDraft({ selectedPhotoIds: [], favoritePhotoIds: [] });
  }

  function goToStep(step: AlbumWizardStep) {
    if (isLocked && step !== "review") return;
    updateDraft({ step });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildStory() {
    if (isLocked) return;
    if (draft.pages.length > 0 && !window.confirm("Isso substituirá as páginas atuais. Deseja continuar?")) return;
    const selected = photos.filter((photo) => selectedSet.has(photo.id));
    const pages = buildAlbumPagesFromPhotos(selected, draft.favoritePhotoIds);
    updateDraft({ pages, step: "editor" });
    setActivePageIndex(0);
  }

  function changePageLayout(layout: AlbumLayoutId) {
    if (isLocked) return;
    setDraft((current) => {
      const pages = [...current.pages];
      const page = pages[activePageIndex];
      if (!page) return current;
      const slotCount = ALBUM_LAYOUT_SLOTS[layout];
      const slots = [...page.slots];
      while (slots.length < slotCount) slots.push({ mediaId: "" });
      pages[activePageIndex] = {
        ...page,
        layout,
        slots: slots.slice(0, slotCount).map((slot, index) => (slot.mediaId ? slot : page.slots[index] || { mediaId: "" }))
      };
      return { ...current, pages };
    });
  }

  function updateSlot(slotIndex: number, patch: Partial<(typeof draft.pages)[0]["slots"][0]>) {
    if (isLocked) return;
    setDraft((current) => {
      const pages = [...current.pages];
      const page = pages[activePageIndex];
      if (!page) return current;
      const slots = [...page.slots];
      slots[slotIndex] = { ...slots[slotIndex], ...patch };
      pages[activePageIndex] = { ...page, slots };
      return { ...current, pages };
    });
  }

  function addPage() {
    if (isLocked || draft.pages.length >= ALBUM_MAX_PAGES) return;
    setDraft((current) => ({
      ...current,
      pages: [
        ...current.pages,
        {
          id: newPageId(),
          layout: "single" as AlbumLayoutId,
          slots: [{ mediaId: "" }]
        }
      ]
    }));
  }

  function removePage() {
    if (isLocked || draft.pages.length <= ALBUM_MIN_PAGES) return;
    if (!window.confirm("Remover esta página do álbum?")) return;
    setDraft((current) => {
      const pages = current.pages.filter((_, index) => index !== activePageIndex);
      return { ...current, pages };
    });
    setActivePageIndex((index) => Math.max(0, index - 1));
  }

  function movePage(direction: -1 | 1) {
    setActivePageIndex((index) => Math.max(0, Math.min(draft.pages.length - 1, index + direction)));
  }

  async function submitAlbum() {
    if (isLocked) return;
    setSubmitError(null);
    setSubmitState("loading");
    try {
      await savePhotoAlbumDraftRemote(event.id, { ...draft, step: "review" });
      const result = await purchasePhotoAlbum(event.id);
      if (!result.ok && !result.redirected) {
        setSubmitError(result.error ?? "Não foi possível iniciar o pagamento.");
      }
      if (result.ok && !result.redirected) {
        await reloadOrder();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar álbum.");
    } finally {
      setSubmitState("idle");
    }
  }

  const activePage = draft.pages[activePageIndex];
  const coverPhoto = draft.cover.coverMediaId ? mediaById.get(draft.cover.coverMediaId) : undefined;
  const coverPhotoUrl = coverPhoto ? resolveMediaItemUrl(event.id, coverPhoto) : null;

  return (
    <div className="photo-album-page">
      <header className="photo-album-header">
        <div>
          <Mono>Linha do Tempo das Memórias™</Mono>
          <h1 className="serif-i">Álbum de fotos</h1>
          <p>
            Transforme as memórias digitais da Cápsula do Tempo em um legado físico. Você não está só escolhendo fotos —
            está construindo uma história.
          </p>
          {!isLocked ? (
            <p className="photo-album-save-hint">
              {saveState === "saving" ? "Salvando…" : saveState === "saved" ? "Rascunho salvo" : saveState === "error" ? "Erro ao salvar — tentando novamente" : null}
            </p>
          ) : null}
        </div>
        <AlbumPricingBar pageCount={pageCount} selectedPhotos={draft.selectedPhotoIds.length} compact />
      </header>

      {isPaid ? (
        <div className="photo-album-success">
          <Icon name="check" size={18} />
          <div>
            <strong>Álbum pago e enviado para produção</strong>
            <p>
              Pedido {order?.id.slice(0, 8).toUpperCase()} · {order?.pageCount} páginas ·{" "}
              {formatAlbumCurrency(order?.totalCents ?? 0)}. Nossa equipe entrará em contato para confirmar impressão e entrega.
            </p>
            <Link href="/dashboard/pagamentos" className="btn btn-ghost btn-sm">
              Ver pagamentos
            </Link>
          </div>
        </div>
      ) : null}

      <nav className="photo-album-steps" aria-label="Etapas do álbum">
        {STEPS.map((step, index) => {
          const active = draft.step === step.id;
          const done = STEPS.findIndex((item) => item.id === draft.step) > index;
          return (
            <button
              key={step.id}
              type="button"
              className={`photo-album-step${active ? " is-active" : ""}${done ? " is-done" : ""}`}
              onClick={() => goToStep(step.id)}
              disabled={isLocked && step.id !== "review"}
            >
              <span>{index + 1}</span>
              {step.label}
            </button>
          );
        })}
      </nav>

      {draft.step === "select" ? (
        <section className="photo-album-panel card">
          <div className="photo-album-toolbar">
            <div className="photo-album-filters">
              <label>
                <span className="fl">Filtrar por data</span>
                <select className="input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} disabled={isLocked}>
                  <option value="all">Todas as datas</option>
                  {monthOptions.map((key) => (
                    <option key={key} value={key}>
                      {monthLabel(key)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="photo-album-fav-filter">
                <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} disabled={isLocked} />
                Só favoritos
              </label>
              <span className="photo-album-soon">Reconhecimento facial — em breve</span>
            </div>
            {!isLocked ? (
              <div className="photo-album-toolbar-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={selectVisible}>
                  Selecionar visíveis
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearSelection}>
                  Limpar
                </button>
              </div>
            ) : null}
          </div>

          {photos.length === 0 ? (
            <div className="photo-album-empty">
              <Icon name="camera" size={28} />
              <p>Ainda não há fotos na Cápsula deste evento.</p>
            </div>
          ) : (
            <div className="photo-album-grid">
              {visiblePhotos.map((photo) => {
                const src = resolveMediaItemUrl(event.id, photo);
                const selected = selectedSet.has(photo.id);
                const favorite = favoriteSet.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    className={`photo-album-thumb${selected ? " is-selected" : ""}`}
                    onClick={() => togglePhoto(photo.id)}
                    disabled={isLocked}
                  >
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={photo.caption || photo.authorName} />
                    ) : (
                      <div className="photo-album-thumb-fallback" />
                    )}
                    <span className="photo-album-thumb-check" aria-hidden>
                      {selected ? <Icon name="check" size={14} /> : null}
                    </span>
                    {!isLocked ? (
                      <span
                        className={`photo-album-thumb-star${favorite ? " is-on" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id);
                        }}
                        role="presentation"
                      >
                        ★
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {!isLocked ? (
            <div className="photo-album-panel-footer">
              <AlbumPricingBar pageCount={pageCount} selectedPhotos={draft.selectedPhotoIds.length} />
              <button type="button" className="btn btn-coral" disabled={draft.selectedPhotoIds.length === 0} onClick={buildStory}>
                Montar história automaticamente
                <Icon name="arrowR" size={15} />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {draft.step === "editor" ? (
        draft.pages.length === 0 ? (
          <section className="photo-album-panel card">
            <p>Selecione fotos e monte a história antes de editar o álbum.</p>
            <button type="button" className="btn btn-coral" onClick={() => goToStep("select")}>
              Voltar à seleção
            </button>
          </section>
        ) : activePage ? (
          <section className="photo-album-editor">
            <aside className="photo-album-page-list card">
              <div className="photo-album-page-list-head">
                <strong>Páginas</strong>
                <span>{draft.pages.length}</span>
              </div>
              {!isLocked ? (
                <div className="photo-album-page-list-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addPage} disabled={draft.pages.length >= ALBUM_MAX_PAGES}>
                    + Página
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={removePage} disabled={draft.pages.length <= ALBUM_MIN_PAGES}>
                    Remover
                  </button>
                </div>
              ) : null}
              <div className="photo-album-page-list-scroll">
                {draft.pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    className={`photo-album-page-item${index === activePageIndex ? " is-active" : ""}`}
                    onClick={() => setActivePageIndex(index)}
                  >
                    <span>Página {index + 1}</span>
                    {page.chapter ? <small>{page.chapter}</small> : null}
                  </button>
                ))}
              </div>
            </aside>

            <div className="photo-album-editor-main">
              <div className="photo-album-editor-toolbar card">
                <div className="photo-album-preview-modes">
                  {(["spread", "single", "book"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`btn btn-sm${previewMode === mode ? " btn-dark" : " btn-ghost"}`}
                      onClick={() => setPreviewMode(mode)}
                    >
                      {mode === "spread" ? "Página dupla" : mode === "single" ? "Página única" : "Modo 3D"}
                    </button>
                  ))}
                </div>
                <div className="photo-album-page-nav">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => movePage(-1)} disabled={activePageIndex === 0}>
                    <Icon name="arrowL" size={14} />
                  </button>
                  <span>
                    {activePageIndex + 1} / {draft.pages.length}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => movePage(1)} disabled={activePageIndex >= draft.pages.length - 1}>
                    <Icon name="arrowR" size={14} />
                  </button>
                </div>
              </div>

              <div className={`photo-album-preview-stage card${previewMode === "book" ? " is-book" : ""}`}>
                {previewMode === "spread" ? (
                  <div className="album-spread">
                    <AlbumPagePreview eventId={event.id} page={activePage} mediaById={mediaById} spread />
                    <AlbumPagePreview eventId={event.id} page={draft.pages[activePageIndex + 1] || activePage} mediaById={mediaById} spread />
                  </div>
                ) : (
                  <AlbumPagePreview eventId={event.id} page={activePage} mediaById={mediaById} />
                )}
              </div>

              {!isLocked ? (
                <div className="photo-album-editor-controls card">
                  <span className="fl">Layout da página</span>
                  <div className="photo-album-layout-grid">
                    {(Object.keys(ALBUM_LAYOUT_LABELS) as AlbumLayoutId[]).map((layout) => (
                      <button
                        key={layout}
                        type="button"
                        className={`btn btn-sm${activePage.layout === layout ? " btn-dark" : " btn-ghost"}`}
                        onClick={() => changePageLayout(layout)}
                      >
                        {ALBUM_LAYOUT_LABELS[layout]}
                      </button>
                    ))}
                  </div>

                  {activePage.layout === "memory" ? (
                    <>
                      <label className="photo-album-memory-field">
                        <span className="fl">Recado desta página</span>
                        <textarea
                          className="input"
                          rows={3}
                          value={activePage.memory?.text || ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            setDraft((current) => {
                              const pages = [...current.pages];
                              const page = pages[activePageIndex];
                              if (!page) return current;
                              pages[activePageIndex] = { ...page, memory: { text, font: page.memory?.font || "serif" } };
                              return { ...current, pages };
                            });
                          }}
                        />
                      </label>
                      <div className="photo-album-style-grid">
                        {(["serif", "sans"] as const).map((font) => (
                          <button
                            key={font}
                            type="button"
                            className={`btn btn-sm${activePage.memory?.font === font ? " btn-dark" : " btn-ghost"}`}
                            onClick={() => {
                              setDraft((current) => {
                                const pages = [...current.pages];
                                const page = pages[activePageIndex];
                                if (!page) return current;
                                pages[activePageIndex] = {
                                  ...page,
                                  memory: { text: page.memory?.text || "", font }
                                };
                                return { ...current, pages };
                              });
                            }}
                          >
                            {font === "serif" ? "Fonte clássica" : "Fonte moderna"}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {activePage.slots.map((slot, slotIndex) => (
                    <div key={`${activePage.id}-slot-${slotIndex}`} className="photo-album-slot-editor">
                      <label className="photo-album-slot-field">
                        <span className="fl">Foto {slotIndex + 1}</span>
                        <select
                          className="input"
                          value={slot.mediaId || ""}
                          onChange={(e) => updateSlot(slotIndex, { mediaId: e.target.value })}
                        >
                          <option value="">Selecione uma foto</option>
                          {selectedPhotoOptions
                            .filter((photo) => selectedSet.has(photo.id))
                            .map((photo) => (
                              <option key={photo.id} value={photo.id}>
                                {photo.caption || photo.authorName || photo.id.slice(0, 8)}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="photo-album-slot-field">
                        <span className="fl">Legenda Polaroid</span>
                        <input className="input" value={slot.caption || ""} onChange={(e) => updateSlot(slotIndex, { caption: e.target.value })} />
                      </label>
                      <div className="photo-album-slot-row">
                        <label className="photo-album-slot-field">
                          <span className="fl">Data</span>
                          <input className="input" value={slot.dateLabel || ""} onChange={(e) => updateSlot(slotIndex, { dateLabel: e.target.value })} />
                        </label>
                        <label className="photo-album-slot-field">
                          <span className="fl">Local</span>
                          <input className="input" value={slot.location || ""} onChange={(e) => updateSlot(slotIndex, { location: e.target.value })} />
                        </label>
                      </div>
                      <label className="photo-album-slot-field">
                        <span className="fl">Comentário</span>
                        <input className="input" value={slot.note || ""} onChange={(e) => updateSlot(slotIndex, { note: e.target.value })} />
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}

              {!isLocked ? (
                <div className="photo-album-panel-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => goToStep("select")}>
                    Voltar às fotos
                  </button>
                  <button type="button" className="btn btn-coral" onClick={() => goToStep("cover")}>
                    Continuar para a capa
                    <Icon name="arrowR" size={15} />
                  </button>
                </div>
              ) : null}
            </div>

            <AlbumPricingBar pageCount={pageCount} selectedPhotos={draft.selectedPhotoIds.length} />
          </section>
        ) : null
      ) : null}

      {draft.step === "cover" ? (
        <section className="photo-album-panel card">
          <div className="photo-album-cover-grid">
            <div className="photo-album-cover-form">
              <label>
                <span className="fl">Título da capa</span>
                <input
                  className="input"
                  value={draft.cover.title}
                  disabled={isLocked}
                  onChange={(e) => updateDraft({ cover: { ...draft.cover, title: e.target.value } })}
                />
              </label>
              <div>
                <span className="fl">Cor da capa</span>
                <div className="photo-album-swatch-grid">
                  {ALBUM_COVER_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`photo-album-swatch${draft.cover.color === color.id ? " is-active" : ""}`}
                      style={{ background: color.swatch }}
                      disabled={isLocked}
                      onClick={() => updateDraft({ cover: { ...draft.cover, color: color.id } })}
                      aria-label={color.label}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="fl">Estilo</span>
                <div className="photo-album-style-grid">
                  {ALBUM_COVER_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`btn btn-sm${draft.cover.style === style.id ? " btn-dark" : " btn-ghost"}`}
                      disabled={isLocked}
                      onClick={() => updateDraft({ cover: { ...draft.cover, style: style.id } })}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="fl">Foto da capa (opcional)</span>
                <div className="photo-album-cover-picker">
                  <button
                    type="button"
                    className={`btn btn-sm${!draft.cover.coverMediaId ? " btn-dark" : " btn-ghost"}`}
                    disabled={isLocked}
                    onClick={() => updateDraft({ cover: { ...draft.cover, coverMediaId: undefined } })}
                  >
                    Só tipografia
                  </button>
                  {photos
                    .filter((photo) => selectedSet.has(photo.id))
                    .slice(0, 8)
                    .map((photo) => {
                      const src = resolveMediaItemUrl(event.id, photo);
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          className={`photo-album-cover-thumb${draft.cover.coverMediaId === photo.id ? " is-active" : ""}`}
                          disabled={isLocked}
                          onClick={() => updateDraft({ cover: { ...draft.cover, coverMediaId: photo.id } })}
                        >
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" />
                          ) : null}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className={`photo-album-cover-preview cover-${draft.cover.color} style-${draft.cover.style}`}>
              <small className="mono">Praesentia — álbum</small>
              {coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhotoUrl} alt="" className="photo-album-cover-photo" />
              ) : null}
              <strong className="display-i">{draft.cover.title}</strong>
              <span>{new Date(event.date).getFullYear()}</span>
              <p>30 × 30 cm · capa dura · laminação fosca</p>
            </div>
          </div>
          {!isLocked ? (
            <div className="photo-album-panel-footer">
              <button type="button" className="btn btn-ghost" onClick={() => goToStep("editor")}>
                Voltar ao editor
              </button>
              <button type="button" className="btn btn-coral" onClick={() => goToStep("review")}>
                Revisar álbum
                <Icon name="arrowR" size={15} />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {draft.step === "review" ? (
        <section className="photo-album-panel card">
          <AlbumReviewStats pages={draft.pages} />
          <div className="photo-album-review-book">
            <div className={`photo-album-cover-preview cover-${draft.cover.color} style-${draft.cover.style} is-3d`}>
              <small className="mono">Praesentia — álbum</small>
              {coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhotoUrl} alt="" className="photo-album-cover-photo" />
              ) : null}
              <strong className="display-i">{draft.cover.title}</strong>
              <span>{new Date(event.date).getFullYear()}</span>
            </div>
            <div className="photo-album-review-pages photo-album-review-pages-full">
              {draft.pages.map((page) => (
                <AlbumPagePreview key={page.id} eventId={event.id} page={page} mediaById={mediaById} />
              ))}
            </div>
          </div>
          <p className="photo-album-review-note">
            Preview completo · {draft.pages.length} páginas · {formatAlbumCurrency(albumTotalCents(draft.pages.length))}
          </p>
          {isPaid ? null : (
            <>
              {submitError ? <p className="photo-album-error">{submitError}</p> : null}
              <button type="button" className="btn btn-coral" onClick={() => void submitAlbum()} disabled={submitState === "loading" || draft.pages.length < ALBUM_MIN_PAGES}>
                <Icon name="print" size={16} />
                {submitState === "loading" ? "Processando…" : "Pagar e enviar para produção"}
              </button>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
