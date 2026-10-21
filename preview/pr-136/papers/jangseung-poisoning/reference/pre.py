import ref, numpy as np, sys, json, time, warnings; warnings.filterwarnings('ignore')
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
job=sys.argv[1]; out={}
if job=='bcw_attacks':
    X,y=load_breast_cancer(return_X_y=True); y=np.where(y==0,1,-1)
    for det in ['if','ee']:
      for NA in range(50,501,50):
        rs=[]
        for s in range(3):
            rng=np.random.default_rng(1000*NA+s)
            Xtr,Xte,ytr,yte=train_test_split(X,y,train_size=300,test_size=100,stratify=y,random_state=s)
            r=ref.run(Xtr,ytr,Xte,yte,NA,rng,det)
            rs.append([r['accu'][0],np.mean(r['accu']),np.mean(r['acce']),r['accu'][-1],r['acce'][-1],1-r['allowed']/NA])
        out[f'{det}-{NA}']=np.mean(rs,0).round(4).tolist(); print(det,NA,out[f'{det}-{NA}'],flush=True)
elif job=='bcw_size':
    X,y=load_breast_cancer(return_X_y=True); y=np.where(y==0,1,-1)
    for tr in range(50,451,50):
        rs=[]
        for s in range(3):
            rng=np.random.default_rng(7000+tr+s)
            Xtr,Xte,ytr,yte=train_test_split(X,y,train_size=tr,test_size=100,stratify=y,random_state=s)
            r=ref.run(Xtr,ytr,Xte,yte,100,rng,'if')
            rs.append([r['accu'][0],np.mean(r['accu']),np.mean(r['acce']),r['accu'][-1],r['acce'][-1],1-r['allowed']/100])
        out[str(tr)]=np.mean(rs,0).round(4).tolist(); print(tr,out[str(tr)],flush=True)
elif job=='mnist_heat':
    X,Y=ref.mnist()
    for d1 in range(10):
      for d2 in range(d1+1,10):
        rej=[]
        for ntr in [250,500,750,1000]:
          for rep in range(2):
            rng=np.random.default_rng(d1*1000+d2*100+ntr+rep)
            i1=rng.permutation(np.where(Y==d1)[0]); i2=rng.permutation(np.where(Y==d2)[0]); h=ntr//2
            Xp,Xn=X[i1[:h]],X[i2[:h]]
            ADp=IsolationForest(random_state=int(rng.integers(1<<30))).fit(Xp); ADn=IsolationForest(random_state=int(rng.integers(1<<30))).fit(Xn)
            Xtr=np.vstack([Xp,Xn]); ytr=np.r_[np.ones(h),-np.ones(h)]
            j=rng.integers(len(Xtr),size=100)
            p=np.where(ytr[j]==-1, ADp.predict(Xtr[j]), ADn.predict(Xtr[j]))
            rej.append(np.mean(p!=1))
        out[f'{d1}-{d2}']=round(float(np.mean(rej)),4); print(d1,d2,out[f'{d1}-{d2}'],flush=True)
elif job=='mnist_size':
    X,Y=ref.mnist()
    for (d1,d2) in [(0,1),(1,7),(5,8),(4,9),(1,8),(6,9),(0,8),(1,2)]:
      for ntr in [250,500,750,1000]:
        rng=np.random.default_rng(d1*1000+d2*100+ntr)
        i1=rng.permutation(np.where(Y==d1)[0]); i2=rng.permutation(np.where(Y==d2)[0]); h=ntr//2
        tr=np.concatenate([i1[:h],i2[:h]]); te=np.concatenate([i1[h:h+125],i2[h:h+125]])
        yy=lambda ii: np.where(Y[ii]==d1,1,-1)
        r=ref.run(X[tr],yy(tr),X[te],yy(te),100,rng)
        k=f'{d1}-{d2}-{ntr}'; out[k]=[r['accu'][0],float(np.mean(r['accu'])),float(np.mean(r['acce'])),r['accu'][-1],r['acce'][-1],1-r['allowed']/100]; print(k,np.round(out[k],3),flush=True)
json.dump(out,open(job+'.json','w'))
