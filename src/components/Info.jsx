export default function Info({ open, handleClose, config }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="modal-box max-w-sm relative bg-base-100 p-6 rounded-box shadow-xl">
        <h3 className="font-bold text-lg mb-4">About</h3>
        <div className="py-2">
          <h4 className="font-bold mb-2">This tool made possible by:</h4>
          <ul className="menu bg-base-200 rounded-box p-2">
            <li>
              <a href="https://github.com/TheOriginalAyaka" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img src="https://avatars.githubusercontent.com/TheOriginalAyaka" alt="TheOriginalAyaka" />
                  </div>
                </div>
                <div>
                  <div className="font-bold">TheOriginalAyaka</div>
                  <div className="text-xs opacity-70">creator of sekai-stickers</div>
                </div>
              </a>
            </li>
            <li className="mt-2">
              <a href="https://github.com/Aldiba" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img src="https://avatars.githubusercontent.com/Aldiba" alt="Aldiba" />
                  </div>
                </div>
                <div>
                  <div className="font-bold">Aldiba</div>
                  <div className="text-xs opacity-70">外星生物</div>
                </div>
              </a>
            </li>
          </ul>

          <h4 className="font-bold mt-4 mb-2">You can find the source code or contribute here:</h4>
          <ul className="menu bg-base-200 rounded-box p-2">
            <li>
              <a href="https://github.com/Aldiba/shinycolors-stickers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full bg-white p-1">
                    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" />
                  </div>
                </div>
                <div>
                  <div className="font-bold">GitHub</div>
                  <div className="text-xs opacity-70">Source Code</div>
                </div>
              </a>
            </li>
          </ul>

          <div className="mt-6 text-center">
            <h4 className="font-bold">Total stickers made using the app:</h4>
            <p className="text-xl text-secondary">
              {config?.global
                ? config?.global.toLocaleString() + " Sticker"
                : "not available"}
            </p>
          </div>
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-secondary" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
